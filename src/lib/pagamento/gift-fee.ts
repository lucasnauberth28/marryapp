// Taxa do Aceito sobre presentes do plano Básico. Fonte única do texto: planos, módulos, perguntas e cadastro leem daqui.
export const ROTULO_DA_TAXA_DO_PRESENTE = "3,99%";

/** Taxa em pontos-base (3,99% = 399), para a conta ser feita só com inteiros. */
export const TAXA_DO_PRESENTE_EM_PONTOS_BASE = 399;

export type PlanoDaTaxaDoPresente = "basic" | "classic" | "vip";
export type FormaDaTaxaDoPresente = "PIX" | "CREDIT_CARD";

export type ValoresDoPresente = { grossCents: number; feeCents: number; netCents: number };

/** Classic e VIP: os primeiros R$ 10.000,00 em presentes por Pix não têm taxa; acima disso vale só o custo do Pix. */
export const TETO_DO_PIX_SEM_TAXA_EM_CENTAVOS = 1_000_000;
export const ROTULO_DO_TETO_DO_PIX_SEM_TAXA = "R$ 10 mil";
/** Taxa do Pix acima do teto nos planos pagos: o custo do meio de pagamento (0,99%), sem margem. */
export const TAXA_DO_PIX_ACIMA_DO_TETO_EM_PONTOS_BASE = 99;
export const ROTULO_DA_TAXA_ACIMA_DO_TETO = "0,99%";

const taxaEmCentavos = (cents: number, pontosBase: number) => Math.round((cents * pontosBase) / 10_000);

/**
 * Quanto o Aceito retém de um presente e quanto fica para o casal.
 * Básico: taxa de 3,99% em qualquer forma. Classic e VIP: cartão com 3,99%; Pix sem taxa até o teto
 * (`pixSemTaxaJaUsado` = Pix aprovados antes deste, em centavos) e 0,99% só sobre a parte que passa dele.
 * A taxa é arredondada para o centavo mais próximo e nunca passa do valor do presente.
 */
export function calcularValoresDoPresente(grossCents: number, plan: PlanoDaTaxaDoPresente, method: FormaDaTaxaDoPresente, pixSemTaxaJaUsado = 0): ValoresDoPresente {
  const gross = Number.isFinite(grossCents) ? Math.max(0, Math.round(grossCents)) : 0;
  let feeCents: number;
  if (method === "PIX" && plan !== "basic") {
    const livre = Math.max(0, TETO_DO_PIX_SEM_TAXA_EM_CENTAVOS - Math.max(0, pixSemTaxaJaUsado));
    feeCents = taxaEmCentavos(Math.max(0, gross - livre), TAXA_DO_PIX_ACIMA_DO_TETO_EM_PONTOS_BASE);
  } else {
    feeCents = taxaEmCentavos(gross, TAXA_DO_PRESENTE_EM_PONTOS_BASE);
  }
  feeCents = Math.min(gross, feeCents);
  return { grossCents: gross, feeCents, netCents: gross - feeCents };
}

export interface ValoresGravados {
  amount: number;
  netAmount: number | null;
  fee: number | null;
  method: FormaDaTaxaDoPresente;
}

const ehCentavos = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;

/**
 * Bruto, taxa e líquido de um presente aprovado. Usa o que foi gravado quando fecha com o valor pago; senão, a regra
 * do plano. O par "líquido = valor pago e taxa 0" é o rascunho que o checkout grava ao criar o pagamento: quando a
 * regra cobraria taxa, ele não vale. `calculado` diz se a conta saiu da regra (e não do gravado).
 */
export function valoresGravadosOuDoPlano(tx: ValoresGravados, plan: PlanoDaTaxaDoPresente, pixSemTaxaJaUsado = 0): ValoresDoPresente & { calculado: boolean; divergente: boolean } {
  const byPlan = calcularValoresDoPresente(tx.amount, plan, tx.method, pixSemTaxaJaUsado);
  const gravado = ehCentavos(tx.netAmount) && ehCentavos(tx.fee) && tx.netAmount + tx.fee === tx.amount;
  const rascunho = gravado && tx.fee === 0 && byPlan.feeCents > 0;
  if (!gravado || rascunho) return { ...byPlan, calculado: true, divergente: false };
  return { grossCents: tx.amount, feeCents: tx.fee as number, netCents: tx.netAmount as number, calculado: false, divergente: tx.fee !== byPlan.feeCents };
}

/**
 * Soma os presentes aprovados em ordem de chegada, levando em conta o teto do Pix sem taxa (cada Pix sabe quanto do
 * teto já foi usado pelos anteriores). Devolve os valores de cada um, na ordem recebida.
 */
export function valoresEmOrdemDeChegada<T extends ValoresGravados & { createdAt?: Date }>(aprovados: readonly T[], plan: PlanoDaTaxaDoPresente): Map<T, ReturnType<typeof valoresGravadosOuDoPlano>> {
  const ordem = [...aprovados].sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
  const out = new Map<T, ReturnType<typeof valoresGravadosOuDoPlano>>();
  let pixUsado = 0;
  for (const tx of ordem) {
    out.set(tx, valoresGravadosOuDoPlano(tx, plan, pixUsado));
    if (tx.method === "PIX") pixUsado += tx.amount;
  }
  return out;
}
