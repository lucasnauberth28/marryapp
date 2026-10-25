import { PaymentMethod, PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { formatarDataBrasiliaCurtaComAno } from "@/lib/formatacao/data";
import type { PagamentoDoPresente, ResumoDosPresentes } from "./componentes/tipos";

const FUSO = "America/Sao_Paulo";
const chaveDoDia = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO });
const formatoDaHora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: FUSO });
const formatoDaDataCurta = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: FUSO });

/** "hoje, 10:42", "ontem", "2 out" ou "2 out 2025" (de anos anteriores). */
function rotuloDeQuando(date: Date, now: Date) {
  const day = chaveDoDia.format(date);
  if (day === chaveDoDia.format(now)) return `hoje, ${formatoDaHora.format(date)}`;
  if (day === chaveDoDia.format(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return "ontem";
  const sameYear = day.slice(0, 4) === chaveDoDia.format(now).slice(0, 4);
  return (sameYear ? formatoDaDataCurta.format(date) : formatarDataBrasiliaCurtaComAno(date)).replace(".", "");
}

/** Pagamentos reais dos presentes, só do casamento da sessão (leitura). */
export async function carregarPagamentosDosPresentes(weddingId: string) {
  return prisma.transaction.findMany({
    where: { weddingId, status: { in: [PaymentStatus.APPROVED, PaymentStatus.PENDING, PaymentStatus.REFUNDED] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      status: true,
      paymentMethod: true,
      guestName: true,
      createdAt: true,
      guestId: true,
      gift: { select: { title: true } },
      guest: { select: { name: true } },
    },
  });
}

type LinhaDePagamento = Awaited<ReturnType<typeof carregarPagamentosDosPresentes>>[number];

function situacaoDoPagamento(t: LinhaDePagamento): PagamentoDoPresente["situation"] {
  if (t.status === PaymentStatus.PENDING) return "toCheck";
  if (t.status === PaymentStatus.REFUNDED) return "refunded";
  return t.paymentMethod === PaymentMethod.CREDIT_CARD ? "card" : "pix";
}

export function pagamentosParaATela(rows: LinhaDePagamento[], now: Date): PagamentoDoPresente[] {
  return rows.map((t) => ({
    id: t.id,
    from: t.guest?.name || t.guestName || "Convidado sem nome",
    giftTitle: t.gift.title,
    amount: t.amount,
    when: rotuloDeQuando(t.createdAt, now),
    situation: situacaoDoPagamento(t),
  }));
}

export function resumoDosPagamentos(rows: LinhaDePagamento[]): ResumoDosPresentes {
  const approved = rows.filter((t) => t.status === PaymentStatus.APPROVED);
  const pending = rows.filter((t) => t.status === PaymentStatus.PENDING);
  return {
    receivedCents: approved.reduce((acc, t) => acc + t.amount, 0),
    receivedCount: approved.length,
    receivedPeople: new Set(approved.map((t) => t.guestId ?? (t.guestName || t.id))).size,
    toCheckCents: pending.reduce((acc, t) => acc + t.amount, 0),
    toCheckCount: pending.length,
  };
}
