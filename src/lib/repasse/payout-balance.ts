// Saldo a repassar ao casal, SÓ CÁLCULO (sem banco nem Next): soma os presentes aprovados e separa bruto, taxa do
// Aceito e líquido. Não cria repasse e não move dinheiro. A leitura do banco fica em payout-balance-server.ts.
import { calcularValoresDoPresente, type FormaDaTaxaDoPresente, type PlanoDaTaxaDoPresente } from "../pagamento/gift-fee.ts";

export interface TransacaoDoSaldo {
  /** O que o convidado pagou, em centavos. */
  amount: number;
  netAmount: number | null;
  fee: number | null;
  paymentMethod: FormaDaTaxaDoPresente;
  status: "PENDING" | "APPROVED" | "FAILED" | "REFUNDED" | "REJECTED";
}

export interface SaldoDeRepasse {
  /** Presentes aprovados, antes da taxa. */
  grossCents: number;
  /** O que o Aceito retém. */
  feeCents: number;
  /** O que fica para o casal (bruto menos taxa). */
  netCents: number;
  /** Presentes aprovados somados. */
  approvedCount: number;
  /** Pix gerado e ainda não confirmado: só aparece no saldo quando for confirmado. */
  toCheckCents: number;
  toCheckCount: number;
  /** Quantos aprovados não tinham taxa e líquido gravados (ou gravados sem fechar a conta) e foram calculados pelo plano. */
  calculatedCount: number;
  /** Quantos aprovados têm taxa gravada diferente da que o plano vigente cobraria hoje (informativo; a soma usa o gravado). */
  divergentCount: number;
}

/** Plano que decide a taxa: Classic e VIP não cobram no Pix; o personalizado só com o módulo "pixZero"; o resto é Básico. */
export function planoDaTaxaDoPresentePara(planId: string | null, modules: readonly string[] = []): PlanoDaTaxaDoPresente {
  if (planId === "vip") return "vip";
  if (planId === "classic") return "classic";
  if (planId === "custom" && modules.includes("pixZero")) return "classic";
  return "basic";
}

const ehCentavos = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;

/**
 * Soma por casamento. Para cada presente aprovado, usa `netAmount` e `fee` gravados quando eles fecham com o valor pago
 * (líquido + taxa = valor); senão calcula com `giftAmounts` pelo plano vigente do casamento. Estornados, recusados e
 * falhos ficam de fora. Pix pendente vira "a conferir".
 */
export function resumirSaldoDeRepasse(transactions: readonly TransacaoDoSaldo[], plan: PlanoDaTaxaDoPresente): SaldoDeRepasse {
  const out: SaldoDeRepasse = {
    grossCents: 0,
    feeCents: 0,
    netCents: 0,
    approvedCount: 0,
    toCheckCents: 0,
    toCheckCount: 0,
    calculatedCount: 0,
    divergentCount: 0,
  };

  for (const tx of transactions) {
    if (!ehCentavos(tx.amount)) continue;

    if (tx.status === "PENDING") {
      if (tx.paymentMethod === "PIX") {
        out.toCheckCents += tx.amount;
        out.toCheckCount += 1;
      }
      continue;
    }
    if (tx.status !== "APPROVED") continue;

    const byPlan = calcularValoresDoPresente(tx.amount, plan, tx.paymentMethod);
    const stored = ehCentavos(tx.netAmount) && ehCentavos(tx.fee) && tx.netAmount + tx.fee === tx.amount;
    const feeCents = stored ? (tx.fee as number) : byPlan.feeCents;
    if (!stored) out.calculatedCount += 1;
    else if (feeCents !== byPlan.feeCents) out.divergentCount += 1;

    out.approvedCount += 1;
    out.grossCents += tx.amount;
    out.feeCents += feeCents;
    out.netCents += tx.amount - feeCents;
  }

  return out;
}
