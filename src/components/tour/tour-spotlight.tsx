"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LizIllustration } from "@/components/liz/liz-illustration";
import { placeBalloon, type Box, type Placement } from "@/lib/tour/positioning";
import { whereText, type StepPlace, type TourStep } from "@/lib/tour/steps";

export interface TourDone {
  outcome: "completed" | "skipped";
  /** Saiu pelo botão que leva a uma tela (o foco fica com a tela nova). */
  navigated?: boolean;
}

/** Mesmo corte do painel: abaixo de 768px vale a barra inferior e a aba "Mais". */
const MOBILE_QUERY = "(max-width: 767px)";
const subscribeMobile = (cb: () => void) => {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const isMobileNow = () => window.matchMedia(MOBILE_QUERY).matches;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PAD = 6;
/** Quanto esperar o item aparecer (a aba "Mais" desliza ao abrir) antes de pular o passo. */
const GIVE_UP_MS = 1200;
/** Quadros seguidos com o item parado para considerar que ele chegou ao lugar. */
const STABLE_FRAMES = 3;

/** O elemento do passo que está de fato na tela (o menu lateral e a barra de baixo não aparecem juntos). */
function findAnchor(anchor: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${anchor}"]`);
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (el.getClientRects().length > 0 && r.width > 0 && r.height > 0) return el;
  }
  return null;
}

function boxOf(el: Element): Box {
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

const sameBox = (a: Box, b: Box) => Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;

interface Resolved {
  key: string;
  /** Retângulo do item destacado; null quando o passo só explica (sem destaque). */
  box: Box | null;
  place: Placement;
}

/**
 * Passo a passo em destaques: escurece a tela, ilumina o item real do menu e ancora um balão nele.
 * Não bloqueia o app: se o item não existe, o passo é pulado; "Esc" e "Pular" saem a qualquer momento.
 * Foco: vai para o balão a cada passo, Tab percorre só os botões dele, e ao sair o foco volta ao ponto de partida.
 */
export function TourSpotlight({ steps, places, onDone }: { steps: TourStep[]; places: Record<string, StepPlace>; onDone: (done: TourDone) => void }) {
  const mobile = useSyncExternalStore(subscribeMobile, isMobileNow, () => false);
  const device = mobile ? "mobile" : "desktop";

  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [resolved, setResolved] = useState<Resolved | null>(null);

  const list = steps.filter((s) => !hidden.has(s.id));
  const step: TourStep | undefined = list[index];
  const isLast = index >= list.length - 1;
  const key = step ? `${step.id}:${device}` : "";
  const ready = resolved?.key === key;

  const dialogRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLElement | null>(null);

  const next = useCallback(() => {
    if (isLast) onDone({ outcome: "completed" });
    else {
      setDir(1);
      setIndex(index + 1);
    }
  }, [isLast, index, onDone]);
  const back = useCallback(() => {
    if (index === 0) return;
    setDir(-1);
    setIndex(index - 1);
  }, [index]);
  const skip = useCallback(() => onDone({ outcome: "skipped" }), [onDone]);

  /** Calcula onde ficam o destaque e o balão para o item atual. */
  const place = useCallback(
    (el: HTMLElement | null, forKey: string) => {
      const box = el ? boxOf(el) : null;
      const dialog = dialogRef.current;
      const width = dialog?.offsetWidth ?? 340;
      const height = dialog?.offsetHeight ?? 320;
      const vw = { width: window.innerWidth, height: window.innerHeight };
      const prefer = mobile && box ? (box.top + box.height / 2 > vw.height * 0.55 ? "top" : "bottom") : "right";
      setResolved({ key: forKey, box, place: placeBalloon({ target: box, viewport: vw, balloon: { width, height }, prefer }) });
    },
    [mobile],
  );

  // Acha o item do passo (a barra de baixo do celular mostra as 5 áreas, sem "Mais"); espera o item parar de mexer.
  useEffect(() => {
    if (!step) return;
    let stopped = false;
    let frame = 0;
    let last: Box | null = null;
    let stable = 0;
    let scrolled = false;
    const started = performance.now();

    const giveUp = () => {
      if (list.length <= 1) return onDone({ outcome: "skipped" });
      if (dir > 0 && isLast) return onDone({ outcome: "completed" });
      setHidden((prev) => new Set(prev).add(step.id));
      if (dir < 0) setIndex((i) => Math.max(0, i - 1));
    };

    const tick = () => {
      if (stopped) return;
      // Passo sem item para destacar (o botão da Liz fica escondido durante o passo a passo): balão no centro
      if (step.floating) {
        anchorRef.current = null;
        place(null, key);
        return;
      }
      const el = findAnchor(step.anchor);
      if (el) {
        if (!scrolled) {
          scrolled = true;
          el.scrollIntoView({ block: "center", inline: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
        }
        const box = boxOf(el);
        stable = last && sameBox(last, box) ? stable + 1 : 0;
        last = box;
        if (stable >= STABLE_FRAMES) {
          anchorRef.current = el;
          place(el, key);
          return;
        }
      } else if (performance.now() - started > GIVE_UP_MS) {
        giveUp();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
    };
    // list/dir/isLast/onDone só entram em giveUp: o passo e o aparelho decidem quando procurar de novo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Redesenha se a janela mudar de tamanho ou algo rolar
  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = anchorRef.current;
        if (!step?.floating && el?.isConnected) place(el, key);
      });
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [ready, key, place, step?.floating]);

  // Foco no balão a cada passo. O navegador só aceita o foco quando o balão já está visível, o que pode levar
  // alguns quadros depois de o passo ficar pronto: tenta de novo até pegar (no máximo meio segundo).
  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    let tries = 0;
    const focusDialog = () => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      dialog.focus({ preventScroll: true });
      if (document.activeElement !== dialog && tries++ < 30) frame = requestAnimationFrame(focusDialog);
    };
    frame = requestAnimationFrame(focusDialog);
    return () => cancelAnimationFrame(frame);
  }, [ready, key]);

  // Teclado: Esc sai, setas andam, Tab fica dentro do balão
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      } else if (e.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const items = Array.from(dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
        if (items.length === 0) return;
        const active = document.activeElement;
        const first = items[0];
        const lastItem = items[items.length - 1];
        if (!dialog.contains(active) || active === dialog) {
          e.preventDefault();
          (e.shiftKey ? lastItem : first).focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          lastItem.focus();
        } else if (!e.shiftKey && active === lastItem) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, skip]);

  if (!step) return null;
  const placeInfo = step.href ? (places[step.href] ?? null) : null;
  const where = whereText(step, placeInfo, device);
  // O destaque fica no item anterior até o novo chegar (e então desliza); o balão só aparece com o item pronto
  const shown = ready ? resolved : null;
  const hole = resolved?.box ? { ...resolved, box: resolved.box } : null;

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Cobre a tela: o app fica parado enquanto o balão está aberto; sair é sempre possível (Esc ou Pular) */}
      <div className="absolute inset-0" aria-hidden="true" />

      {hole && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-xl motion-safe:transition-[top,left,width,height] motion-safe:duration-300 motion-safe:ease-out"
          style={{
            top: hole.box.top,
            left: hole.box.left,
            width: hole.box.width,
            height: hole.box.height,
            boxShadow:
              "0 0 0 2px var(--color-papel), 0 0 0 5px var(--color-ameixa), 0 0 0 9999px color-mix(in srgb, var(--color-scrim) 62%, transparent)",
          }}
        />
      )}
      {/* Antes de achar o item, só o escurecido */}
      {!hole && <div className="pointer-events-none absolute inset-0 bg-scrim/60" aria-hidden="true" />}

      <p className="sr-only" role="status" aria-live="polite">
        Passo {index + 1} de {list.length}: {step.title}
      </p>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-passo-titulo"
        aria-describedby="tour-passo-texto"
        tabIndex={-1}
        style={shown ? { top: shown.place.top, left: shown.place.left } : { top: 0, left: 0 }}
        className={`absolute flex w-[min(360px,calc(100vw-24px))] flex-col gap-3 rounded-2xl border border-linha bg-papel p-4 text-tinta shadow-[var(--shadow-aceito-2)] outline-none md:p-5 ${
          shown ? "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200" : "invisible"
        }`}
      >
        {shown && shown.place.side !== "center" && <Arrow side={shown.place.side} offset={shown.place.arrow} />}

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold leading-5 text-tinta-suave" aria-hidden="true">
            Passo {index + 1} de {list.length}
          </p>
          <Button variant="quiet" size="sm" onClick={skip} className="-mr-2 -mt-1">
            Pular
          </Button>
        </div>

        <div className="flex items-start gap-3">
          {/* Passo da Liz: ela mesma cumprimenta (decorativa, o título já diz "Liz") */}
          {step.id === "liz" && <LizIllustration pose="cumprimentando" height={112} decorative className="h-28 w-auto shrink-0" />}
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 id="tour-passo-titulo" className="font-display text-[22px] font-medium leading-7 text-tinta">
              {step.title}
            </h2>
            <p id="tour-passo-texto" className="text-base leading-6 text-tinta-suave">
              {step.what}
            </p>
          </div>
        </div>

        {where && (
          <p className="flex items-start gap-2 rounded-xl bg-ameixa-suave px-3 py-2.5 text-[15px] leading-5 text-tinta">
            <MousePointerClick className="mt-0.5 size-4 shrink-0 text-ameixa" aria-hidden="true" />
            <span>{where}</span>
          </p>
        )}

        <div className="flex flex-col gap-2">
          {step.cta && step.href && (
            <Button asChild variant="outline">
              <Link href={step.href} onClick={() => onDone({ outcome: isLast ? "completed" : "skipped", navigated: true })}>
                {step.cta}
              </Link>
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={back} disabled={index === 0} className="flex-1">
              <ArrowLeft aria-hidden="true" />
              Voltar
            </Button>
            <Button onClick={next} className="flex-1">
              {isLast ? "Concluir" : "Próximo"}
              {!isLast && <ArrowRight aria-hidden="true" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Seta do balão apontando para o item destacado. */
function Arrow({ side, offset }: { side: Exclude<Placement["side"], "center">; offset: number }) {
  const common = "absolute size-3 rotate-45 border-linha bg-papel";
  if (side === "right") return <span aria-hidden="true" className={`${common} -left-1.5 border-b border-l`} style={{ top: offset - 6 }} />;
  if (side === "left") return <span aria-hidden="true" className={`${common} -right-1.5 border-r border-t`} style={{ top: offset - 6 }} />;
  if (side === "bottom") return <span aria-hidden="true" className={`${common} -top-1.5 border-l border-t`} style={{ left: offset - 6 }} />;
  return <span aria-hidden="true" className={`${common} -bottom-1.5 border-b border-r`} style={{ left: offset - 6 }} />;
}
