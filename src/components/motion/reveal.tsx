import { type CSSProperties, type ElementType, type ReactNode } from "react";

type RevealVariant = "up" | "fade" | "scale" | "arch" | "left" | "right";

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  variant?: RevealVariant;
  /** Atraso em ms; use múltiplos de 80 para escalonar itens de uma lista. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  id?: string;
  role?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/**
 * Faz o conteúdo surgir suavemente quando entra na tela. Não precisa de "use client":
 * só marca o elemento; o RevealObserver (no layout raiz) cuida da animação.
 * Sem JavaScript ou com movimento reduzido, o conteúdo aparece direto.
 */
export function Reveal({ children, as: Tag = "div", variant = "up", delay = 0, className, style, id, ...aria }: RevealProps) {
  return (
    <Tag
      id={id}
      {...aria}
      data-reveal={variant}
      // O RevealObserver marca data-revealed fora do React; isso pode acontecer antes da hidratação.
      suppressHydrationWarning
      className={className}
      style={{ ...style, ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
