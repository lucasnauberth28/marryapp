"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Rolagem suave com inércia (Lenis) para as páginas públicas.
 * Fica desligada em telas de toque (a rolagem nativa já é suave) e com movimento reduzido.
 * Links âncora (#secao) rolam suavemente respeitando o cabeçalho fixo.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || touch) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      // O deslocamento do cabeçalho vem do scroll-padding-top do CSS; o Lenis já o respeita.
      anchors: true,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  // Ao trocar de página, começa do topo sem animar.
  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
}
