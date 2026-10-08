"use client";

/**
 * Ilhas de interatividade da landing. A página em si é um Server Component (page.tsx);
 * aqui ficam só os pedaços que precisam do navegador.
 */
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import { Seal } from "@/components/landing/seal";
import { btn } from "@/components/landing/styles";
import { cn } from "@/lib/utils";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/* -------------------------------------------------------------------------------------------- */
/* Contador que sobe até o número quando entra na tela.                                         */
/* -------------------------------------------------------------------------------------------- */

export function CountUp({ to, duration = 1600, delay = 0 }: { to: number; duration?: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    let frame = 0;
    let timer = 0;
    // O servidor já entrega o número final; aqui ele recomeça do zero e sobe ao aparecer.
    el.textContent = "0";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        timer = window.setTimeout(() => {
          const start = performance.now();
          const tick = (now: number) => {
            const t = clamp01((now - start) / duration);
            el.textContent = String(Math.round(to * (1 - Math.pow(1 - t, 3))));
            if (t < 1) frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
        }, delay);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      el.textContent = String(to);
    };
  }, [to, duration, delay]);

  return (
    <span ref={ref} className="tabular-nums">
      {to}
    </span>
  );
}

/* -------------------------------------------------------------------------------------------- */
/* Faixa que desliza na horizontal enquanto a página rola.                                       */
/* -------------------------------------------------------------------------------------------- */

export function ScrollDrift({ children, distance = 240, className }: { children: ReactNode; distance?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div ref={ref} className={className} style={reduce ? undefined : { x }}>
        {children}
      </m.div>
    </LazyMotion>
  );
}

/* -------------------------------------------------------------------------------------------- */
/* Vitrine de fornecedores: no computador acompanha a rolagem; no toque, rola com o dedo.        */
/* -------------------------------------------------------------------------------------------- */

const DESKTOP_QUERY = "(min-width: 768px) and (pointer: fine)";
function subscribeDesktop(cb: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

export function VendorStrip({ children, className, trackClassName }: { children: ReactNode; className?: string; trackClassName?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const fine = useSyncExternalStore(subscribeDesktop, getDesktop, () => false);
  const drift = fine && !reduce;
  const distance = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: outer, offset: ["start end", "end start"] });
  const x = useTransform(() => -clamp01((scrollYProgress.get() - 0.18) / 0.6) * distance.get());

  useEffect(() => {
    if (!drift) return;
    const measure = () => {
      if (!outer.current || !track.current) return;
      distance.set(Math.max(0, track.current.scrollWidth - outer.current.clientWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outer.current) ro.observe(outer.current);
    return () => ro.disconnect();
  }, [drift, distance]);

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        ref={outer}
        className={cn(
          drift
            ? "overflow-hidden"
            : "snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className,
        )}
      >
        <m.div ref={track} className={cn("flex w-max", trackClassName)} style={drift ? { x } : undefined}>
          {children}
        </m.div>
      </div>
    </LazyMotion>
  );
}

/* -------------------------------------------------------------------------------------------- */
/* Convite de exemplo que responde de verdade (só na tela, nada é enviado).                      */
/* -------------------------------------------------------------------------------------------- */

type Rsvp = "idle" | "yes" | "no";

export function RsvpDemo() {
  const [state, setState] = useState<Rsvp>("idle");
  const result = useRef<HTMLParagraphElement>(null);
  const firstAction = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);

  const choose = (next: Rsvp) => {
    moved.current = true;
    setState(next);
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <section
          aria-label="Exemplo de convite: experimente responder"
          className="relative w-full max-w-[380px] rounded-[16px] border border-linha bg-papel px-6 pb-6 pt-8 text-center shadow-[var(--shadow-aceito-2)] before:pointer-events-none before:absolute before:inset-2 before:rounded-[10px] before:border before:border-champanhe/70 before:content-['']"
        >
          <div className="relative min-h-[296px]" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {state === "idle" ? (
                <m.div
                  key="idle"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onAnimationStart={() => {
                    if (moved.current) firstAction.current?.focus();
                  }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <p className="text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">Seu convite chegou</p>
                  <p className="mb-1 mt-2 font-display text-[40px] leading-[46px] tracking-[-0.015em]">
                    Ana <em className="italic">&amp;</em> Rafael
                  </p>
                  <div className="my-5 flex flex-col gap-1 text-sm leading-5 text-tinta-suave">
                    <span className="inline-flex items-center justify-center gap-2">
                      <Calendar aria-hidden="true" className="size-4" strokeWidth={2} />
                      Sábado, 17 de abril de 2027 · 16h
                    </span>
                    <span className="inline-flex items-center justify-center gap-2">
                      <MapPin aria-hidden="true" className="size-4" strokeWidth={2} />
                      Itu, São Paulo
                    </span>
                  </div>
                  <p className="mb-4 text-base">
                    Mariana, guardamos <strong className="font-semibold">2 lugares</strong> para você.
                  </p>
                  <div className="grid gap-2">
                    <button ref={firstAction} type="button" onClick={() => choose("yes")} className={cn(btn.primary, btn.block)}>
                      Aceito o convite
                    </button>
                    <button type="button" onClick={() => choose("no")} className={cn(btn.quiet, btn.block)}>
                      Não vou poder ir
                    </button>
                  </div>
                </m.div>
              ) : (
                <m.div
                  key={state}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onAnimationStart={() => result.current?.focus()}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                  className="flex min-h-[296px] flex-col items-center justify-center gap-3"
                >
                  {state === "yes" ? (
                    <m.span
                      initial={{ scale: 1.6, opacity: 0, rotate: -12 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                      className="mb-2 inline-flex"
                    >
                      <Seal size="lg" label="Presença confirmada" />
                    </m.span>
                  ) : null}
                  <p ref={result} tabIndex={-1} className="font-display text-[34px] leading-10 outline-none">
                    {state === "yes" ? "Que alegria!" : "Que pena."}
                  </p>
                  <p className="max-w-[28ch] text-base leading-6 text-tinta-suave">
                    {state === "yes"
                      ? "Mariana, sua presença está confirmada. Os detalhes chegam no seu WhatsApp."
                      : "Avisamos Ana e Rafael. Se os planos mudarem, é só responder de novo pelo mesmo link."}
                  </p>
                  <button type="button" onClick={() => choose("idle")} className={cn(btn.quiet, btn.sm, "mt-2")}>
                    Ver o convite de novo
                  </button>
                </m.div>
              )}
            </AnimatePresence>
          </div>
          <p className="relative mt-4 border-t border-linha pt-3 text-sm text-tinta-suave">Experimente: é só um exemplo.</p>
        </section>
      </MotionConfig>
    </LazyMotion>
  );
}
