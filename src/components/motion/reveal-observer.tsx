"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Observa todos os elementos [data-reveal] e marca data-revealed quando entram na tela.
 * Usa um atributo que o React não controla (e não uma classe): assim não há divergência
 * de hidratação nem risco de um novo render apagar a marca e esconder o elemento.
 * Um único observer para a página inteira; novos elementos (navegação no cliente) são
 * captados pelo MutationObserver.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const revealAll = () =>
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => el.setAttribute("data-revealed", ""));

    if (reduce || !("IntersectionObserver" in window) || !root.classList.contains("js")) {
      revealAll();
      return;
    }

    // Palavras de títulos ficam dentro de uma máscara com overflow oculto; enquanto escondidas,
    // estão 100% recortadas e o IntersectionObserver nunca as veria. Observa-se a máscara.
    const targets = new Map<Element, Element>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (targets.get(entry.target) ?? entry.target).setAttribute("data-revealed", "");
            targets.delete(entry.target);
            io.unobserve(entry.target);
          }
        }
      },
      // Limite 0 com margem inferior: o arco começa recortado (clip-path) e teria razão de interseção 0.
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );

    const track = (el: HTMLElement) => {
      if (el.hasAttribute("data-revealed")) return;
      const target = el.dataset.reveal === "word" && el.parentElement ? el.parentElement : el;
      targets.set(target, el);
      io.observe(target);
    };

    const observe = (scope: ParentNode) =>
      scope.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])").forEach(track);

    observe(document);
    root.classList.add("reveal-ready");

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches("[data-reveal]")) track(node);
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
