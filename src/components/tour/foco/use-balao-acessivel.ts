// O balão do tour: redesenha ao mexer na janela, recebe o foco a cada passo e responde ao teclado.
import { useEffect } from "react";
import type { PassoDoTour } from "@/lib/tour/steps";

interface Redesenho {
  ready: boolean;
  key: string;
  step: PassoDoTour | undefined;
  anchorRef: React.RefObject<HTMLElement | null>;
  place: (el: HTMLElement | null, forKey: string) => void;
}

/** Redesenha se a janela mudar de tamanho ou algo rolar. */
export function useRedesenhoAoMexerNaJanela({ ready, key, step, anchorRef, place }: Redesenho) {
  const flutuante = step?.floating;
  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = anchorRef.current;
        if (!flutuante && el?.isConnected) place(el, key);
      });
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [ready, key, place, flutuante, anchorRef]);
}

/**
 * Foco no balão a cada passo. O navegador só aceita o foco quando o balão já está visível, o que pode levar
 * alguns quadros depois de o passo ficar pronto: tenta de novo até pegar (no máximo meio segundo).
 */
export function useFocoNoBalao(ready: boolean, key: string, dialogRef: React.RefObject<HTMLDivElement | null>) {
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
  }, [ready, key, dialogRef]);
}

/** Tab percorre só os botões do balão (dentro dele o foco dá a volta). */
function prenderOFocoNoBalao(e: KeyboardEvent, dialog: HTMLDivElement | null) {
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

/** Teclado: Esc sai, setas andam, Tab fica dentro do balão. */
export function useTecladoDoTour(dialogRef: React.RefObject<HTMLDivElement | null>, next: () => void, back: () => void, skip: () => void) {
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
      } else if (e.key === "Tab") prenderOFocoNoBalao(e, dialogRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, skip, dialogRef]);
}
