import { Metadata } from "next"
import { PaymentMethod, PaymentStatus } from "@prisma/client"
import prisma from "@/lib/prisma"
import { getGifts } from "@/actions/gift-actions"
import { GiftsClient, type GiftPayment } from "./gifts-client"
import { requireWeddingPage } from "@/lib/security/wedding-context"
import { weddingSitePath } from "@/lib/wedding-links"

export const metadata: Metadata = {
  title: "Vitrine de Presentes",
  description: "Gerencie os presentes de casamento",
}

const TZ = "America/Sao_Paulo"
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ })
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
const shortDateFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: TZ })
const longDateFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric", timeZone: TZ })

/** "hoje, 10:42", "ontem", "2 out" ou "2 out 2025" (de anos anteriores). */
function whenLabel(date: Date, now: Date) {
  const day = dayKey.format(date)
  if (day === dayKey.format(now)) return `hoje, ${timeFmt.format(date)}`
  if (day === dayKey.format(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return "ontem"
  const sameYear = day.slice(0, 4) === dayKey.format(now).slice(0, 4)
  return (sameYear ? shortDateFmt : longDateFmt).format(date).replace(".", "")
}

export default async function PresentesAdminPage() {
  const { weddingId, wedding } = await requireWeddingPage("/presentes-admin")

  const result = await getGifts()
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
  const payments: GiftPayment[] = rows.map((t) => ({
    id: t.id,
    from: t.guest?.name || t.guestName || "Convidado sem nome",
    giftTitle: t.gift.title,
    amount: t.amount,
    when: whenLabel(t.createdAt, now),
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
      <GiftsClient
        initialGifts={gifts || []}
        payments={payments}
        siteGiftsHref={weddingSitePath(wedding.slug, "presentes")}
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
