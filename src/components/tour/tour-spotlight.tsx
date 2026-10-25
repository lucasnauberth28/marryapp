"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { textoDoLugar, type LugarDoPasso, type PassoDoTour } from "@/lib/tour/steps";
import { assinarTelaMovel, ehTelaMovelAgora, type AncoraResolvida, type TourConcluido } from "./foco/ancora";
import { BalaoDoTour } from "./foco/balao";
import { useBuscaDaAncora, usePosicionarBalao } from "./foco/use-ancora";
import { useFocoNoBalao, useRedesenhoAoMexerNaJanela, useTecladoDoTour } from "./foco/use-balao-acessivel";

export type { TourConcluido };

/** O buraco iluminado sobre o item real; o resto da tela escurece. */
function Destaque({ box }: { box: NonNullable<AncoraResolvida["box"]> | null }) {
  if (!box) return <div className="pointer-events-none absolute inset-0 bg-scrim/60" aria-hidden="true" />;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute rounded-xl motion-safe:transition-[top,left,width,height] motion-safe:duration-300 motion-safe:ease-out"
      style={{
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
        boxShadow: "0 0 0 2px var(--color-papel), 0 0 0 5px var(--color-ameixa), 0 0 0 9999px color-mix(in srgb, var(--color-scrim) 62%, transparent)",
      }}
    />
  );
}

/**
 * Passo a passo em destaques: escurece a tela, ilumina o item real do menu e ancora um balão nele.
 * Não bloqueia o app: se o item não existe, o passo é pulado; "Esc" e "Pular" saem a qualquer momento.
 * Foco: vai para o balão a cada passo, Tab percorre só os botões dele, e ao sair o foco volta ao ponto de partida.
 */
export function FocoDoTour({ steps, places, onDone }: { steps: PassoDoTour[]; places: Record<string, LugarDoPasso>; onDone: (done: TourConcluido) => void }) {
  const mobile = useSyncExternalStore(assinarTelaMovel, ehTelaMovelAgora, () => false);
  const device = mobile ? "mobile" : "desktop";
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [resolved, setResolved] = useState<AncoraResolvida | null>(null);

  const list = steps.filter((s) => !hidden.has(s.id));
  const step: PassoDoTour | undefined = list[index];
  const isLast = index >= list.length - 1;
  const key = step ? `${step.id}:${device}` : "";
  const ready = resolved?.key === key;
  const dialogRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLElement | null>(null);

  const next = useCallback(() => {
    if (isLast) return onDone({ outcome: "completed" });
    setDir(1);
    setIndex(index + 1);
  }, [isLast, index, onDone]);
  const back = useCallback(() => {
    if (index === 0) return;
    setDir(-1);
    setIndex(index - 1);
  }, [index]);
  const skip = useCallback(() => onDone({ outcome: "skipped" }), [onDone]);

  const place = usePosicionarBalao(dialogRef, mobile, setResolved);
  useBuscaDaAncora({ step, key, list, dir, isLast, onDone, place, anchorRef, esconderPasso: (id) => setHidden((prev) => new Set(prev).add(id)), voltarUm: () => setIndex((i) => Math.max(0, i - 1)) });
  useRedesenhoAoMexerNaJanela({ ready, key, step, anchorRef, place });
  useFocoNoBalao(ready, key, dialogRef);
  useTecladoDoTour(dialogRef, next, back, skip);

  if (!step) return null;
  const where = textoDoLugar(step, step.href ? (places[step.href] ?? null) : null, device);

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Cobre a tela: o app fica parado enquanto o balão está aberto; sair é sempre possível (Esc ou Pular) */}
      <div className="absolute inset-0" aria-hidden="true" />
      {/* O destaque fica no item anterior até o novo chegar (e então desliza); o balão só aparece com o item pronto */}
      <Destaque box={resolved?.box ?? null} />
      <p className="sr-only" role="status" aria-live="polite">
        Passo {index + 1} de {list.length}: {step.title}
      </p>
      <BalaoDoTour dialogRef={dialogRef} step={step} index={index} total={list.length} isLast={isLast} where={where} posicao={ready ? resolved.place : null} aoVoltar={back} aoAvancar={next} aoPular={skip} aoConcluir={onDone} />
    </div>
  );
}
