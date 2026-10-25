import type { ComponentType, ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Peças visuais do design do Aceito usadas nas telas de presentes, finanças, carteira,
 * site, fornecedores e administração: cartão de papel, sobretítulo, chip de status.
 */

/** `ac-card`: papel, borda linha, raio de 16px e sombra 1. */
export const estiloDoCartao = "rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]"

/** Título de cartão (`ac-card__title`). */
export const estiloDoTituloDoCartao = "text-xl font-semibold leading-7 text-tinta"

/** Sobretítulo `ac-overline`: só em rótulos curtos acima de um número ou título. */
export const estiloDoSobretitulo = "text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave"

/** Número de destaque em fonte display. */
export const estiloDoNumeroGrande = "font-num text-[36px] leading-10 tabular-nums text-tinta md:text-[40px] md:leading-[44px]"

/** Cabeçalho de coluna de tabela do design. */
export const estiloDoTituloDaColunaDoCasal = "px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave first:pl-6 last:pr-6"

export type TomDaEtiqueta = "sucesso" | "aviso" | "perigo" | "neutro" | "salvia"

const TONS_DA_ETIQUETA: Record<TomDaEtiqueta, string> = {
  sucesso: "bg-sucesso-suave text-sucesso",
  aviso: "bg-aviso-suave text-aviso",
  perigo: "bg-perigo-suave text-perigo",
  neutro: "bg-areia text-tinta-suave",
  salvia: "bg-salvia-suave text-salvia",
}

/** Chip de status (`ac-chip`): sempre ícone e palavra, nunca só cor. */
export function Etiqueta({
  tone,
  icon: Icon,
  children,
  className,
}: {
  tone: TomDaEtiqueta
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 w-fit items-center gap-1 whitespace-nowrap rounded-lg px-3 text-sm font-semibold leading-5",
        Icon && "pl-2",
        TONS_DA_ETIQUETA[tone],
        className,
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
      {children}
    </span>
  )
}
