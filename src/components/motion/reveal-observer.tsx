"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Observa todos os elementos [data-reveal] e adiciona .is-revealed quando entram na tela.
 * Um único observer para a página inteira; novos elementos (navegação no cliente) são
 * captados pelo MutationObserver.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const revealAll = () =>
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => el.classList.add("is-revealed"));

    if (reduce || !("IntersectionObserver" in window) || !root.classList.contains("js")) {
      revealAll();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    const observe = (scope: ParentNode) =>
      scope.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-revealed)").forEach((el) => io.observe(el));

    observe(document);
    root.classList.add("reveal-ready");

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches("[data-reveal]")) io.observe(node);
            observe(node);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
