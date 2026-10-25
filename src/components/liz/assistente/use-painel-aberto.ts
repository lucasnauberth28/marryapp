"use client";

import { useEffect } from "react";

const ELEMENTOS_FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** No celular o Tab não escapa da folha: do último item volta ao primeiro, e vice-versa. */
function prenderOTab(e: KeyboardEvent, painel: HTMLElement) {
  const items = Array.from(painel.querySelectorAll<HTMLElement>(ELEMENTOS_FOCAVEIS));
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || active === painel)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

interface Entrada {
  open: boolean;
  mobile: boolean;
  panelRef: React.RefObject<HTMLDivElement | null>;
  fabRef: React.RefObject<HTMLButtonElement | null>;
  close: (returnFocus: boolean) => void;
}

/** Aberto: foco no painel, Esc e clique fora fecham, no celular a rolagem do fundo trava e o Tab não escapa. */
export function useComportamentoDoPainelAberto({ open, mobile, panelRef, fabRef, close }: Entrada) {
  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
      } else if (e.key === "Tab" && mobile && panelRef.current) prenderOTab(e, panelRef.current);
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || fabRef.current?.contains(target)) return;
      close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    const previousOverflow = document.body.style.overflow;
    if (mobile) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, mobile, close, panelRef, fabRef]);
}
