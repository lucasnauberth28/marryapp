// Taxa do Aceito sobre presentes do plano Básico. Fonte única do texto: planos, módulos, perguntas e cadastro leem daqui.
export const ROTULO_DA_TAXA_DO_PRESENTE = "3,99%";

/** Taxa em pontos-base (3,99% = 399), para a conta ser feita só com inteiros. */
export const TAXA_DO_PRESENTE_EM_PONTOS_BASE = 399;

export type PlanoDaTaxaDoPresente = "basic" | "classic" | "vip";
export type FormaDaTaxaDoPresente = "PIX" | "CREDIT_CARD";

export type ValoresDoPresente = { grossCents: number; feeCents: number; netCents: number };

/**
 * Quanto o Aceito retém de um presente e quanto fica para o casal.
 * No Classic e no VIP, presente pago por Pix não tem taxa; no cartão (e no Básico, em qualquer forma) vale a taxa.
 * A taxa é arredondada para o centavo mais próximo e nunca passa do valor do presente.
 */
export function calcularValoresDoPresente(grossCents: number, plan: PlanoDaTaxaDoPresente, method: FormaDaTaxaDoPresente): ValoresDoPresente {
  const gross = Number.isFinite(grossCents) ? Math.max(0, Math.round(grossCents)) : 0;
  const free = method === "PIX" && plan !== "basic";
  const feeCents = free ? 0 : Math.min(gross, Math.round((gross * TAXA_DO_PRESENTE_EM_PONTOS_BASE) / 10_000));
  return { grossCents: gross, feeCents, netCents: gross - feeCents };
}
