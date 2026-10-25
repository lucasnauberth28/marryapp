import type { ConvidadoDaConfirmacaoPublica } from "@/lib/rsvp-lookup";

export interface PropriedadesDaConfirmacaoCliente {
  /** Casamento do endereço: a busca e a confirmação ficam restritas a ele */
  slug: string;
  coupleNames: string;
  dateLabel: string | null;
  locationName: string | null;
}

export type ConvidadoDaConfirmacao = ConvidadoDaConfirmacaoPublica;
export type RespostaDoConvite = "CONFIRMED" | "DECLINED";

export const estiloDoSobretitulo = "text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave";
export const estiloDoTitulo = "font-display text-[34px] font-medium leading-10 tracking-[-0.015em] text-tinta outline-none";

/** Etapas recebem o título para o foco ir até ele quando a etapa troca. */
export interface PropriedadesDaEtapa {
  titulo: React.RefObject<HTMLHeadingElement | null>;
}
