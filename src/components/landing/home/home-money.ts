// Contas e formatos de dinheiro da home (simulador de presentes e comparação de planos). Puro: roda nos testes.
import { formatarValorSemSimbolo } from "../../../lib/formatacao/dinheiro.ts";
import { TAXA_DO_PRESENTE_EM_PONTOS_BASE } from "../../../lib/pagamento/gift-fee.ts";

/** Texto digitado ("1.250,50", "200", "200,5") em centavos; null se não for um valor válido. */
export function interpretarCentavos(text: string): number | null {
  let s = text.replace(/[^\d,.]/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/\.(?=\d{3}(\D|$))/g, "");
  const n = Number.parseFloat(s);
  return Number.isFinite(n) && n >= 0 && n < 10_000_000 ? Math.round(n * 100) : null;
}

/** Centavos em "1.250,50" (sem o R$). */
export const formatarCentavos = formatarValorSemSimbolo;

/**
 * Valor em presentes por Pix a partir do qual pagar o plano (preço único) sai mais barato
 * do que a taxa do Básico: o menor valor cuja taxa já alcança o preço do plano.
 */
export function centavosDoPontoDeEquilibrio(planPriceCents: number): number {
  if (planPriceCents <= 0) return 0;
  return Math.ceil((planPriceCents * 10_000) / TAXA_DO_PRESENTE_EM_PONTOS_BASE);
}

/** Preço em partes para exibir "R$ 149,00" com os centavos pequenos. */
export function separarPreco(cents: number): { reais: string; centavos: string } {
  return { reais: Math.floor(cents / 100).toLocaleString("pt-BR"), centavos: String(cents % 100).padStart(2, "0") };
}
