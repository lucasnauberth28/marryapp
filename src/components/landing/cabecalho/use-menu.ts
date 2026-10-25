"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { prenderOTab } from "../prender-o-tab";

/** O cabeçalho ganha fundo ao rolar. */
function useRolou() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

/** O menu em tela cheia: abre/fecha, fecha ao trocar de página, trava a rolagem, Esc fecha e o Tab não escapa. */
export function useMenuEmTelaCheia() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  // Fecha o menu ao trocar de página. Ajuste de estado durante a renderização,
  // como recomenda o React para estado derivado de props.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    closeButton.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      } else if (e.key === "Tab" && dialog.current) prenderOTab(e, dialog.current);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, menuButton, closeButton, dialog, scrolled: useRolou() };
}
