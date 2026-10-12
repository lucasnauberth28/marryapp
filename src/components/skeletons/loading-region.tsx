import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Região de carregamento: envolve o esqueleto de um `loading.tsx` ou de um fallback de Suspense.
 * Anuncia para leitor de tela ("Carregando os convidados...") e marca a área como ocupada; os blocos
 * de dentro são decorativos (aria-hidden).
 *   <LoadingRegion label="os convidados" className="flex flex-col gap-6">…esqueleto…</LoadingRegion>
 * - label: o que está carregando, sem o verbo ("a agenda", "seus pedidos"). Padrão: "a página".
 *   (Se começar com "Carregando", o texto é usado como veio.)
 * - Entrada de 150ms em fade, para o esqueleto não "piscar" em navegações muito rápidas.
 */
export function LoadingRegion({
  label = "a página",
  className,
  children,
}: {
  label?: string;
  className?: string;
  children?: ReactNode;
}) {
  const text = /^carregando/i.test(label) ? label : `Carregando ${label}`;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-slot="loading-region"
      className={cn("animate-in fade-in duration-150", className)}
    >
      <span className="sr-only">{text}...</span>
      {children}
    </div>
  );
}
