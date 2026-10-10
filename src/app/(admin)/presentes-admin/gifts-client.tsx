"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useSyncedState } from "@/hooks/use-synced-state"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Clock, CreditCard, Gift as GiftIcon, ImageOff, Loader2, Plus, Trash2, Undo2 } from "lucide-react"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { GiftLocal as Gift } from "@/types/local"
import { deleteGift } from "@/actions/gift-actions"
import { PageHeader } from "@/components/admin/page-header"
import { btn } from "@/components/landing/styles"
import { Chip, bigNumber, card, cardTitle, overline, th, type ChipTone } from "@/components/casal/ui"
import { GiftModal } from "./gift-modal"

export interface GiftPayment {
  id: string
  from: string
  giftTitle: string
  /** Em centavos. */
  amount: number
  when: string
  situation: "pix" | "card" | "toCheck" | "refunded"
}

interface GiftsSummary {
  receivedCents: number
  receivedCount: number
  receivedPeople: number
  toCheckCents: number
  toCheckCount: number
}

interface GiftsClientProps {
  initialGifts: Gift[]
  payments: GiftPayment[]
  summary: GiftsSummary
  siteGiftsHref: string
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
// Centavos para "R$ 4.870" (sem centavos quando redondo) ou "R$ 4.870,50".
function formatPrice(cents: number) {
  return brl.format(cents / 100).replace(/,00$/, "").replace(/ /g, " ")
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

const SITUATION: Record<GiftPayment["situation"], { tone: ChipTone; icon: typeof Check; label: string }> = {
  pix: { tone: "sucesso", icon: Check, label: "Pix recebido" },
  card: { tone: "sucesso", icon: CreditCard, label: "Cartão recebido" },
  toCheck: { tone: "aviso", icon: Clock, label: "A conferir" },
  refunded: { tone: "neutro", icon: Undo2, label: "Estornado" },
}

export function GiftsClient({ initialGifts, payments, summary, siteGiftsHref }: GiftsClientProps) {
  const router = useRouter()
  const [gifts, setGifts] = useSyncedState<Gift[]>(initialGifts)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)

  function handleDelete(id: string) {
    setConfirmAction(() => () => {
      setDeletingId(id)
      const toastId = toast.loading("Removendo presente da vitrine...")
      startTransition(async () => {
        const result = await deleteGift(id)
        if (!result.success) {
          toast.error(result.error || "Erro ao realizar operação.", {
            id: toastId,
            duration: 6000,
            description: "Ocorreu um erro inesperado no servidor.",
          })
        } else {
          setGifts(prev => prev.filter(g => g.id !== id))
          toast.success("Presente excluído com sucesso!", { id: toastId })
          router.refresh()
        }
        setDeletingId(null)
      })
    })
    setConfirmOpen(true)
  }

  const giftedCount = gifts.filter(g => g.isPurchased).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Site e presentes"
        title="Presentes"
        actions={
          <>
            <Link href={siteGiftsHref} target="_blank" rel="noopener" className={`${btn.secondary}`}>
              Ver como o convidado vê
            </Link>
            <button type="button" onClick={() => setIsModalOpen(true)} className={btn.primary}>
              <Plus className="size-4" aria-hidden="true" /> Novo presente
            </button>
          </>
        }
      />

      {/* Resumo: só o que o sistema sabe de verdade (pagamentos dos presentes) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <article className={`${card} flex flex-col gap-2 p-5 sm:p-6`}>
          <p className={overline}>Total recebido</p>
          <span className={bigNumber}>{formatPrice(summary.receivedCents)}</span>
          <span className="text-sm text-tinta-suave">
            {summary.receivedCount === 0
              ? "Os presentes pagos aparecem aqui."
              : `${plural(summary.receivedCount, "presente", "presentes")} de ${plural(summary.receivedPeople, "pessoa", "pessoas")}`}
          </span>
        </article>
        <article className={`${card} flex flex-col gap-2 p-5 sm:p-6 ${summary.toCheckCount > 0 ? "border-2 border-aviso/50" : ""}`}>
          <p className={overline}>A conferir</p>
          <span className={bigNumber}>{formatPrice(summary.toCheckCents)}</span>
          <span className="text-sm text-tinta-suave">
            {summary.toCheckCount === 0 ? (
              "Nenhum Pix esperando conferência."
            ) : (
              <>
                {summary.toCheckCount} Pix esperando conferência.{" "}
                <Link href="/financas" className="inline-flex min-h-11 items-center font-semibold text-ameixa underline-offset-4 hover:underline sm:min-h-0">
                  Conferir em Finanças
                </Link>
              </>
            )}
          </span>
        </article>
        <article className={`${card} flex flex-col gap-2 p-5 sm:p-6`}>
          <p className={overline}>Presentes ganhos</p>
          <span className={bigNumber}>{giftedCount}</span>
          <span className="text-sm text-tinta-suave">
            {gifts.length === 0 ? "Cadastrem o primeiro presente." : `de ${plural(gifts.length, "presente na vitrine", "presentes na vitrine")}`}
          </span>
        </article>
      </div>

      {/* Recebidos */}
      <section aria-labelledby="recebidos-titulo" className={`${card} overflow-hidden`}>
        <div className="px-5 pb-2 pt-5 sm:px-6">
          <h2 id="recebidos-titulo" className={cardTitle}>Recebidos</h2>
        </div>
        {payments.length === 0 ? (
          <p className="px-5 pb-6 pt-2 text-[15px] text-tinta-suave sm:px-6">
            Quando alguém presentear vocês, o pagamento aparece aqui com o nome de quem enviou.
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-[15px]">
                <thead>
                  <tr className="border-b border-linha">
                    <th scope="col" className={th}>De</th>
                    <th scope="col" className={th}>Presente</th>
                    <th scope="col" className={th}>Valor</th>
                    <th scope="col" className={th}>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const s = SITUATION[p.situation]
                    return (
                      <tr key={p.id} className="border-b border-linha last:border-b-0">
                        <td className="py-3.5 pl-6 pr-3">
                          <strong className="font-semibold text-tinta">{p.from}</strong>
                          <br />
                          <span className="text-sm text-tinta-suave">{p.when}</span>
                        </td>
                        <td className="px-3 py-3.5 text-tinta">{p.giftTitle}</td>
                        <td className="px-3 py-3.5 font-semibold tabular-nums text-tinta">{formatPrice(p.amount)}</td>
                        <td className="py-3.5 pl-3 pr-6">
                          <Chip tone={s.tone} icon={s.icon}>{s.label}</Chip>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-linha border-t border-linha md:hidden">
              {payments.map((p) => {
                const s = SITUATION[p.situation]
                return (
                  <li key={p.id} className="flex flex-col gap-2 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-tinta">{p.from}</p>
                        <p className="text-sm text-tinta-suave">{p.when}</p>
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums text-tinta">{formatPrice(p.amount)}</span>
                    </div>
                    <p className="text-[15px] text-tinta">{p.giftTitle}</p>
                    <Chip tone={s.tone} icon={s.icon}>{s.label}</Chip>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>

      {/* Vitrine */}
      <section aria-labelledby="vitrine-titulo" className="flex flex-col gap-3">
        <h2 id="vitrine-titulo" className={cardTitle}>
          Vitrine · {plural(gifts.length, "presente", "presentes")}
        </h2>
        {gifts.length === 0 ? (
          <div className={`${card} flex flex-col items-center justify-center px-4 py-16 text-center`}>
            <GiftIcon className="mb-3 size-10 text-linha-forte" aria-hidden="true" />
            <p className="font-semibold text-tinta">Vocês ainda não cadastraram presentes</p>
            <p className="mt-1 max-w-xs text-sm text-tinta-suave">
              Cadastrem o primeiro com nome e valor. Pode ser um item da casa ou uma cota da lua de mel.
            </p>
            <button type="button" onClick={() => setIsModalOpen(true)} className={`${btn.primary} mt-5`}>
              Cadastrar o primeiro presente
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-4">
            {gifts.map((gift) => (
              <li key={gift.id} className={`${card} flex flex-col gap-2 p-3`}>
                <div className="grid aspect-square place-items-center overflow-hidden rounded-xl bg-areia text-xs text-tinta-suave">
                  {gift.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={gift.imageUrl} alt="" className="block size-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-1">
                      <ImageOff className="size-6" aria-hidden="true" />
                      Sem foto
                    </span>
                  )}
                </div>
                <strong className="line-clamp-2 text-[15px] font-semibold leading-5 text-tinta">{gift.title}</strong>
                {gift.isPurchased ? (
                  <span className="text-sm font-semibold text-sucesso">Presenteado · {formatPrice(gift.amount)}</span>
                ) : (
                  <span className="text-sm text-tinta-suave">{formatPrice(gift.amount)} · disponível</span>
                )}
                {!gift.isPurchased && (
                  <button
                    type="button"
                    aria-label={`Excluir ${gift.title}`}
                    onClick={() => handleDelete(gift.id)}
                    disabled={isPending && deletingId === gift.id}
                    className={`${btn.quiet} ${btn.sm} self-start text-perigo hover:bg-perigo-suave`}
                  >
                    {isPending && deletingId === gift.id ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="size-4" aria-hidden="true" />
                    )}
                    Excluir
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <GiftModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          confirmAction?.()
        }}
        title="Excluir presente"
        description="Deseja realmente excluir este item da vitrine?"
      />
    </div>
  )
}
