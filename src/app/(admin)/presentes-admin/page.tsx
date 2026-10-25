import { Metadata } from "next"
import { PaymentMethod, PaymentStatus } from "@prisma/client"
import prisma from "@/lib/prisma"
import { obterPresentes } from "@/actions/gift-actions"
import { PresentesCliente, type PagamentoDoPresente } from "./gifts-client"
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context"
import { caminhoDoSiteDoCasamento } from "@/lib/wedding-links"

import { formatarDataBrasiliaCurtaComAno } from "@/lib/formatacao/data";
export const metadata: Metadata = {
  title: "Presentes em dinheiro",
  description: "Presentes em dinheiro do casamento: o que foi cadastrado e o que já foi recebido",
}

const FUSO = "America/Sao_Paulo"
const chaveDoDia = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO })
const formatoDaHora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: FUSO })
const formatoDaDataCurta = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: FUSO })

/** "hoje, 10:42", "ontem", "2 out" ou "2 out 2025" (de anos anteriores). */
function rotuloDeQuando(date: Date, now: Date) {
  const day = chaveDoDia.format(date)
  if (day === chaveDoDia.format(now)) return `hoje, ${formatoDaHora.format(date)}`
  if (day === chaveDoDia.format(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return "ontem"
  const sameYear = day.slice(0, 4) === chaveDoDia.format(now).slice(0, 4)
  return (sameYear ? formatoDaDataCurta.format(date) : formatarDataBrasiliaCurtaComAno(date)).replace(".", "")
}

export default async function PresentesAdminPage() {
  const { weddingId, wedding } = await exigirCasamentoNaPagina("/presentes-admin")

  const result = await obterPresentes()
  const gifts = result.success ? result.data : []

  // Pagamentos reais dos presentes, só do casamento da sessão (leitura).
  const rows = await prisma.transaction.findMany({
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
  })

  const now = new Date()
  const payments: PagamentoDoPresente[] = rows.map((t) => ({
    id: t.id,
    from: t.guest?.name || t.guestName || "Convidado sem nome",
    giftTitle: t.gift.title,
    amount: t.amount,
    when: rotuloDeQuando(t.createdAt, now),
    situation:
      t.status === PaymentStatus.PENDING
        ? "toCheck"
        : t.status === PaymentStatus.REFUNDED
          ? "refunded"
          : t.paymentMethod === PaymentMethod.CREDIT_CARD
            ? "card"
            : "pix",
  }))

  const approved = rows.filter((t) => t.status === PaymentStatus.APPROVED)
  const pending = rows.filter((t) => t.status === PaymentStatus.PENDING)
  const people = new Set(approved.map((t) => t.guestId ?? (t.guestName || t.id))).size

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PresentesCliente
        initialGifts={gifts || []}
        payments={payments}
        siteGiftsHref={caminhoDoSiteDoCasamento(wedding.slug, "presentes")}
        summary={{
          receivedCents: approved.reduce((acc, t) => acc + t.amount, 0),
          receivedCount: approved.length,
          receivedPeople: people,
          toCheckCents: pending.reduce((acc, t) => acc + t.amount, 0),
          toCheckCount: pending.length,
        }}
      />
    </div>
  )
}
