// Resumo do casamento: extrato único dos presentes (valores, taxa e líquido por forma de pagamento).
import { calcularValoresDoPresente, type ValoresDoPresente, type FormaDaTaxaDoPresente, type PlanoDaTaxaDoPresente } from "../pagamento/gift-fee.ts";

/** Plano que decide a taxa: Classic e VIP não cobram no Pix; o personalizado só com o módulo "pixZero"; o resto é Básico. */
export function planoDaTaxaDoPresenteDe(planId: string | null, modules: readonly string[] = []): PlanoDaTaxaDoPresente {
  if (planId === "vip") return "vip";
  if (planId === "classic") return "classic";
  if (planId === "custom" && modules.includes("pixZero")) return "classic";
  return "basic";
}

export interface TransacaoDePresente {
  id: string;
  giftId: string;
  /** Centavos que o convidado pagou. */
  amount: number;
  netAmount: number | null;
  fee: number | null;
  method: FormaDaTaxaDoPresente;
  status: "PENDING" | "APPROVED" | "FAILED" | "REFUNDED" | "REJECTED";
  who: string;
  createdAt: Date;
}

const ehCentavos = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;

/**
 * Bruto, taxa e líquido de um presente. Usa a taxa e o líquido gravados quando fecham com o valor pago;
 * senão calcula pelo plano do casamento (os Pix conferidos à mão não gravam líquido). O par "líquido = valor pago e
 * taxa 0" é o que o checkout grava ao criar o pagamento (ainda sem a conta da taxa): quando o plano cobraria taxa,
 * esse par não vale e a conta sai do plano.
 */
export function valoresDaTransacao(tx: Pick<TransacaoDePresente, "amount" | "netAmount" | "fee" | "method">, plan: PlanoDaTaxaDoPresente): ValoresDoPresente {
  const byPlan = calcularValoresDoPresente(tx.amount, plan, tx.method);
  const stored = ehCentavos(tx.netAmount) && ehCentavos(tx.fee) && tx.netAmount + tx.fee === tx.amount;
  const placeholder = stored && tx.fee === 0 && byPlan.feeCents > 0;
  if (!stored || placeholder) return byPlan;
  return { grossCents: tx.amount, feeCents: tx.fee as number, netCents: tx.netAmount as number };
}

export interface ExtratoDePresentes {
  /** Recebido (bruto): o que os convidados pagaram nos presentes aprovados. */
  grossCents: number;
  /** Taxa do Aceito retida nesses presentes. */
  feeCents: number;
  /** O que fica para o casal. */
  netCents: number;
  approvedCount: number;
  pixCount: number;
  cardCount: number;
  /** Pix gerado e ainda não conferido: só entra no recebido quando o casal confere. */
  toCheckCents: number;
  toCheckCount: number;
}

export function resumirPresentes(rows: readonly TransacaoDePresente[], plan: PlanoDaTaxaDoPresente): ExtratoDePresentes {
  const out: ExtratoDePresentes = { grossCents: 0, feeCents: 0, netCents: 0, approvedCount: 0, pixCount: 0, cardCount: 0, toCheckCents: 0, toCheckCount: 0 };
  for (const tx of rows) {
    if (!ehCentavos(tx.amount)) continue;
    if (tx.status === "PENDING") {
      if (tx.method === "PIX") {
        out.toCheckCents += tx.amount;
        out.toCheckCount += 1;
      }
      continue;
    }
    if (tx.status !== "APPROVED") continue;
    const a = valoresDaTransacao(tx, plan);
    out.approvedCount += 1;
    out.grossCents += a.grossCents;
    out.feeCents += a.feeCents;
    out.netCents += a.netCents;
    if (tx.method === "PIX") out.pixCount += 1;
    else out.cardCount += 1;
  }
  return out;
}

export interface LinhaDePresente extends ValoresDoPresente {
  tx: TransacaoDePresente;
  /** Pix a conferir (a linha leva o botão "Conferir"). */
  toCheck: boolean;
}

/** Últimos presentes do extrato: os Pix a conferir primeiro, depois os aprovados, do mais novo ao mais antigo. */
export function ultimasLinhasDePresentes(rows: readonly TransacaoDePresente[], plan: PlanoDaTaxaDoPresente, limit: number): LinhaDePresente[] {
  return rows
    .filter((tx) => tx.status === "APPROVED" || (tx.status === "PENDING" && tx.method === "PIX"))
    .map((tx) => ({ tx, toCheck: tx.status === "PENDING", ...valoresDaTransacao(tx, plan) }))
    .sort((a, b) => Number(b.toCheck) - Number(a.toCheck) || b.tx.createdAt.getTime() - a.tx.createdAt.getTime())
    .slice(0, limit);
}
