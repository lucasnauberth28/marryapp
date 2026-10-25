import type { PresenteLocal as Gift } from "@/types/local";

export interface PropriedadesDoPagamentoCliente {
  gift: Gift;
  coupleNames: string;
  /** Casamento do presente (/casamento/<slug>) */
  slug: string;
  /** Falso quando o cartão não está disponível: só o Pix é oferecido. */
  cardEnabled?: boolean;
  /** Valor cobrado no cartão (presente mais a tarifa do cartão), calculado no servidor com a mesma conta da cobrança. */
  cardAmount: number;
}

export type EtapaDoPagamento = "IDENTIFICATION" | "METHOD" | "PAYMENT" | "SUCCESS";
export type FormaDePagamento = "PIX" | "CREDIT_CARD";

export const ESTILO_DO_SOBRETITULO = "text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave";
export const ESTILO_DO_TITULO = "font-display text-[30px] font-medium leading-[36px] tracking-[-0.015em] text-tinta outline-none";

/** Passos que recebem o título para o foco ir até ele quando a etapa troca. */
export interface PropriedadesDoPasso {
  titulo: React.RefObject<HTMLHeadingElement | null>;
}
