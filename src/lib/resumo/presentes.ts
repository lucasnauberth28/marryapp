// Resumo do casamento: extrato único dos presentes (valores, taxa e líquido por forma de pagamento).
import { valoresEmOrdemDeChegada, valoresGravadosOuDoPlano, type ValoresDoPresente, type FormaDaTaxaDoPresente, type PlanoDaTaxaDoPresente } from "../pagamento/gift-fee.ts";

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

/** Bruto, taxa e líquido de um presente sozinho (sem os anteriores: o teto do Pix sem taxa começa vazio). */
export function valoresDaTransacao(tx: Pick<TransacaoDePresente, "amount" | "netAmount" | "fee" | "method">, plan: PlanoDaTaxaDoPresente, pixSemTaxaJaUsado = 0): ValoresDoPresente {
  const { grossCents, feeCents, netCents } = valoresGravadosOuDoPlano(tx, plan, pixSemTaxaJaUsado);
  return { grossCents, feeCents, netCents };
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
  /** Pix gerado e ainda não confirmado: só entra no recebido quando o pagamento é confirmado. */
  toCheckCents: number;
  toCheckCount: number;
}

export function resumirPresentes(rows: readonly TransacaoDePresente[], plan: PlanoDaTaxaDoPresente): ExtratoDePresentes {
  const out: ExtratoDePresentes = { grossCents: 0, feeCents: 0, netCents: 0, approvedCount: 0, pixCount: 0, cardCount: 0, toCheckCents: 0, toCheckCount: 0 };
  const valores = valoresEmOrdemDeChegada(rows.filter((tx) => tx.status === "APPROVED" && ehCentavos(tx.amount)), plan);
  for (const tx of rows) {
    if (!ehCentavos(tx.amount)) continue;
    if (tx.status === "PENDING") {
      if (tx.method === "PIX") {
        out.toCheckCents += tx.amount;
        out.toCheckCount += 1;
      }
      continue;
    }
    const a = tx.status === "APPROVED" ? valores.get(tx) : undefined;
    if (!a) continue;
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
  /** Pix em confirmação (pelo Mercado Pago ou pela equipe do Aceito). */
  toCheck: boolean;
}

/** Últimos presentes do extrato: os Pix em confirmação primeiro, depois os aprovados, do mais novo ao mais antigo. */
export function ultimasLinhasDePresentes(rows: readonly TransacaoDePresente[], plan: PlanoDaTaxaDoPresente, limit: number): LinhaDePresente[] {
  const aprovados = valoresEmOrdemDeChegada(rows.filter((tx) => tx.status === "APPROVED"), plan);
  // Um Pix em confirmação mostra a taxa que teria se fosse aprovado agora (depois de todos os já aprovados)
  const pixAprovado = rows.reduce((s, tx) => s + (tx.status === "APPROVED" && tx.method === "PIX" ? tx.amount : 0), 0);
  return rows
    .filter((tx) => tx.status === "APPROVED" || (tx.status === "PENDING" && tx.method === "PIX"))
    .map((tx) => {
      const v = aprovados.get(tx) ?? valoresDaTransacao(tx, plan, pixAprovado);
      return { tx, toCheck: tx.status === "PENDING", grossCents: v.grossCents, feeCents: v.feeCents, netCents: v.netCents };
    })
    .sort((a, b) => Number(b.toCheck) - Number(a.toCheck) || b.tx.createdAt.getTime() - a.tx.createdAt.getTime())
    .slice(0, limit);
}
