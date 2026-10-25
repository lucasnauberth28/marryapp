// Textos de apresentação dos planos de casal, em um lugar só: a home, /planos e o cadastro leem daqui.
// Preço, nome e lista de recursos continuam vindo do catálogo (lib/plans.ts + edições da administração).
import { ROTULO_DA_TAXA_DO_PRESENTE } from "./gift-fee.ts";
import type { ChaveDoPlano } from "./plans.ts";

/** "Plano Classic" -> "Classic"; "Fornecedor Pro" -> "Pro". O nome vem sempre do catálogo, para home, planos e cadastro dizerem o mesmo. */
export function rotuloDoPlano(name: string): string {
  return name.replace(/^(Plano|Fornecedor)\s+/, "");
}
export type ChaveDoPlanoDoCasal = "basic" | "classic" | "vip";

/** Resumo de uma linha e texto do botão de cada plano de casal. */
export const TEXTOS_DO_PLANO_DO_CASAL: Record<ChaveDoPlanoDoCasal, { summary: string; cta: (label: string) => string }> = {
  basic: { summary: "Para criar o site e acompanhar as confirmações de presença.", cta: () => "Criar conta grátis" },
  classic: { summary: "Para enviar convites pelo painel e registrar a entrada dos convidados.", cta: (label) => `Escolher ${label}` },
  vip: { summary: "Para ter um endereço personalizado e atendimento prioritário.", cta: (label) => `Escolher ${label}` },
};

/** Preço na linha do plano: "Sem mensalidade" no Básico, "pagamento único" nos pagos. */
export function notaDoPrecoDoCasal(key: ChaveDoPlanoDoCasal): string {
  return key === "basic" ? "sem mensalidade" : "pagamento único";
}

/** Resumo curto de cada plano na escolha do cadastro (inclui fornecedor). */
export const RESUMO_DO_CADASTRO: Record<ChaveDoPlano, string> = {
  basic: TEXTOS_DO_PLANO_DO_CASAL.basic.summary,
  classic: TEXTOS_DO_PLANO_DO_CASAL.classic.summary,
  vip: TEXTOS_DO_PLANO_DO_CASAL.vip.summary,
  start: "Seu perfil na vitrine de fornecedores, após curadoria.",
  pro: "Pedidos de orçamento ilimitados e botão de WhatsApp com o casal.",
  master: "Destaque nas buscas e painel de resultados.",
};

/** Condições dos presentes, na ordem em que aparecem em /planos e na pergunta sobre presentes. */
export const CONDICOES_DO_PRESENTE = {
  fee: `No Básico, o Aceito cobra ${ROTULO_DA_TAXA_DO_PRESENTE} por presente recebido. No Classic e no VIP, essa taxa não vale para presentes pagos por Pix.`,
  pix: "No Pix, quem presenteia paga o valor do presente, sem acréscimo.",
  card: "No cartão, quem presenteia vê o valor com a tarifa do cartão antes de pagar e pode parcelar em até 12 vezes.",
} as const;
