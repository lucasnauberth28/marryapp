import { Fragment, type CSSProperties, type ElementType, type ReactNode } from "react";

export type RevealVariant = "up" | "fade" | "scale" | "arch" | "left" | "right";

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  variant?: RevealVariant;
  /** Atraso em ms; use múltiplos de 80 para escalonar itens de uma lista. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/**
 * Faz o conteúdo surgir suavemente quando entra na tela. Não precisa de "use client":
 * só marca o elemento; o RevealObserver (no layout raiz) cuida da animação.
 * Sem JavaScript ou com movimento reduzido, o conteúdo aparece direto.
 */
export function Reveal({ children, as: Tag = "div", variant = "up", delay = 0, className, style, id }: RevealProps) {
  return (
    <Tag
      id={id}
      data-reveal={variant}
      className={className}
      style={{ ...style, ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/**
 * Título que entra palavra por palavra. Use em títulos display curtos.
 */
export function RevealWords({
  text,
  className,
  baseDelay = 0,
  step = 70,
}: {
  text: string;
  className?: string;
  baseDelay?: number;
  step?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span aria-hidden="true" className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <span
              data-reveal="word"
              className="inline-block"
              style={{ ["--reveal-delay" as string]: `${baseDelay + i * step}ms` }}
            >
              {word}
            </span>
          </span>
          {/* O espaço fica fora do inline-block: dentro dele, o navegador o descartaria. */}
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
