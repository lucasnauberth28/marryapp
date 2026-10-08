"use client";

import { useRef, type ReactNode } from "react";
import { LazyMotion, domAnimation, m, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * Desloca o conteúdo levemente enquanto a seção passa pela tela (efeito de profundidade).
 * `strength` em px: 40 a 80 fica elegante; acima disso cansa.
 */
export function Parallax({ children, strength = 60, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [strength, -strength]);

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div ref={ref} className={className} style={reduce ? undefined : { y }}>
        {children}
      </m.div>
    </LazyMotion>
  );
}
