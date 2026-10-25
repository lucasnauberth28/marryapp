"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useEstadoSincronizado } from "@/hooks/use-synced-state"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Clock, CreditCard, ImageOff, Plus, Trash2, Undo2 } from "lucide-react"
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal"
import { PresenteLocal as Gift } from "@/types/local"
import { excluirPresente } from "@/actions/gift-actions"
import { CabecalhoDaPagina } from "@/components/admin/page-header"
import { estiloDoBotao } from "@/components/landing/styles"
import { Etiqueta, estiloDoNumeroGrande, estiloDoCartao, estiloDoTituloDoCartao, estiloDoSobretitulo, estiloDoTituloDaColunaDoCasal, type TomDaEtiqueta } from "@/components/casal/ui"
import { ModalDoPresente } from "./gift-modal"
import { BotaoComCarregamento } from "@/components/painel/loading-button"
import { ImagemDaPessoa } from "@/components/ui/user-image"
import { IlustracaoDaLiz } from "@/components/liz/liz-illustration"

import { formatarReaisEnxuto } from "@/lib/formatacao/dinheiro";
import { pluralizar } from "@/lib/formatacao/plural";
export interface PagamentoDoPresente {
  id: string
  from: string
  giftTitle: string
  /** Em centavos. */
  amount: number
  when: string
  situation: "pix" | "card" | "toCheck" | "refunded"
}

interface ResumoDosPresentes {
  receivedCents: number
  receivedCount: number
  receivedPeople: number
  toCheckCents: number
  toCheckCount: number
}

interface PropriedadesDosPresentesCliente {
  initialGifts: Gift[]
  payments: PagamentoDoPresente[]
  summary: ResumoDosPresentes
  siteGiftsHref: string
}

const SITUACAO: Record<PagamentoDoPresente["situation"], { tone: TomDaEtiqueta; icon: typeof Check; label: string }> = {
  pix: { tone: "sucesso", icon: Check, label: "Pix recebido" },
  card: { tone: "sucesso", icon: CreditCard, label: "Cartão recebido" },
  toCheck: { tone: "aviso", icon: Clock, label: "A conferir" },
  refunded: { tone: "neutro", icon: Undo2, label: "Estornado" },
}

export function PresentesCliente({ initialGifts, payments, summary, siteGiftsHref }: PropriedadesDosPresentesCliente) {
  const router = useRouter()
  const [gifts, setGifts] = useEstadoSincronizado<Gift[]>(initialGifts)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)

  function handleDelete(id: string) {
    setConfirmAction(() => () => {
      setDeletingId(id)
      const toastId = toast.loading("Excluindo o presente...")
      startTransition(async () => {
        const result = await excluirPresente(id)
        if (!result.success) {
          toast.error(result.error || "Não deu para excluir o presente. Tente de novo.", {
            id: toastId,
            duration: 6000,
          })
        } else {
          setGifts(prev => prev.filter(g => g.id !== id))
          toast.success("Presente excluído.", { id: toastId })
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
      <CabecalhoDaPagina
        eyebrow="Site e presentes"
        title="Presentes em dinheiro"
        description="Cada presente tem um valor em reais. O convidado escolhe um da lista e paga por Pix ou cartão. Nenhum produto é entregue: o presente é o valor."
        actions={
          <>
            <Link href={siteGiftsHref} target="_blank" rel="noopener" className={`${estiloDoBotao.secondary}`}>
              Ver como o convidado vê
            </Link>
            <button type="button" onClick={() => setIsModalOpen(true)} className={estiloDoBotao.primary}>
              <Plus className="size-4" aria-hidden="true" /> Novo presente
            </button>
          </>
        }
      />

      {/* Resumo: só o que o sistema sabe de verdade (pagamentos dos presentes) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <article className={`${estiloDoCartao} flex flex-col gap-2 p-5 sm:p-6`}>
          <p className={estiloDoSobretitulo}>Total recebido</p>
          <span className={estiloDoNumeroGrande}>{formatarReaisEnxuto(summary.receivedCents)}</span>
          <span className="text-sm text-tinta-suave">
            {summary.receivedCount === 0
              ? "Os presentes pagos aparecem aqui."
              : `${pluralizar(summary.receivedCount, "presente", "presentes")} de ${pluralizar(summary.receivedPeople, "pessoa", "pessoas")}`}
          </span>
        </article>
        <article className={`${estiloDoCartao} flex flex-col gap-2 p-5 sm:p-6 ${summary.toCheckCount > 0 ? "border-2 border-aviso/50" : ""}`}>
          <p className={estiloDoSobretitulo}>A conferir</p>
          <span className={estiloDoNumeroGrande}>{formatarReaisEnxuto(summary.toCheckCents)}</span>
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
        <article className={`${estiloDoCartao} flex flex-col gap-2 p-5 sm:p-6`}>
          <p className={estiloDoSobretitulo}>Presentes pagos</p>
          <span className={estiloDoNumeroGrande}>{giftedCount}</span>
          <span className="text-sm text-tinta-suave">
            {gifts.length === 0 ? "Cadastrem o primeiro presente." : `de ${pluralizar(gifts.length, "presente cadastrado", "presentes cadastrados")}`}
          </span>
        </article>
      </div>

      {/* Recebidos */}
      <section aria-labelledby="recebidos-titulo" className={`${estiloDoCartao} overflow-hidden`}>
        <div className="px-5 pb-2 pt-5 sm:px-6">
          <h2 id="recebidos-titulo" className={estiloDoTituloDoCartao}>Recebidos</h2>
        </div>
        {payments.length === 0 ? (
          <div className="flex flex-col items-start gap-1 px-5 pb-6 pt-2 text-[15px] text-tinta-suave sm:px-6">
            <p>Vocês ainda não receberam presentes pelo Aceito.</p>
            {gifts.length === 0 ? (
              <>
                <p>Para receber, cadastrem o primeiro presente. Ele aparece na lista de presentes do site.</p>
                <button type="button" onClick={() => setIsModalOpen(true)} className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-ameixa hover:underline">
                  Cadastrar presente
                </button>
              </>
            ) : (
              <>
                <p>Quando um convidado pagar, o pagamento aparece aqui com o nome de quem enviou.</p>
                <Link href={siteGiftsHref} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center font-semibold text-ameixa hover:underline">
                  Ver a lista como o convidado vê
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-[15px]">
                <thead>
                  <tr className="border-b border-linha">
                    <th scope="col" className={estiloDoTituloDaColunaDoCasal}>De</th>
                    <th scope="col" className={estiloDoTituloDaColunaDoCasal}>Presente</th>
                    <th scope="col" className={estiloDoTituloDaColunaDoCasal}>Valor</th>
                    <th scope="col" className={estiloDoTituloDaColunaDoCasal}>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const s = SITUACAO[p.situation]
                    return (
                      <tr key={p.id} className="border-b border-linha last:border-b-0">
                        <td className="py-3.5 pl-6 pr-3">
                          <strong className="font-semibold text-tinta">{p.from}</strong>
                          <br />
                          <span className="text-sm text-tinta-suave">{p.when}</span>
                        </td>
                        <td className="px-3 py-3.5 text-tinta">{p.giftTitle}</td>
                        <td className="px-3 py-3.5 font-semibold tabular-nums text-tinta">{formatarReaisEnxuto(p.amount)}</td>
                        <td className="py-3.5 pl-3 pr-6">
                          <Etiqueta tone={s.tone} icon={s.icon}>{s.label}</Etiqueta>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-linha border-t border-linha md:hidden">
              {payments.map((p) => {
                const s = SITUACAO[p.situation]
                return (
                  <li key={p.id} className="flex flex-col gap-2 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-tinta">{p.from}</p>
                        <p className="text-sm text-tinta-suave">{p.when}</p>
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums text-tinta">{formatarReaisEnxuto(p.amount)}</span>
                    </div>
                    <p className="text-[15px] text-tinta">{p.giftTitle}</p>
                    <Etiqueta tone={s.tone} icon={s.icon}>{s.label}</Etiqueta>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>

      {/* Vitrine */}
      <section aria-labelledby="vitrine-titulo" className="flex flex-col gap-3">
        <h2 id="vitrine-titulo" className={estiloDoTituloDoCartao}>
          Presentes no site · {gifts.length}
        </h2>
        {gifts.length === 0 ? (
          <div className={`${estiloDoCartao} flex flex-col items-center justify-center px-4 pb-16 pt-8 text-center`}>
            {/* Vitrine vazia: a Liz tranquila (decorativa); a área de valores recebidos fica sem ela */}
            <IlustracaoDaLiz pose="tranquila" height={104} decorative className="mb-3 h-[104px] w-auto" />
            <p className="font-semibold text-tinta">Vocês ainda não cadastraram presentes</p>
            <p className="mt-1 max-w-xs text-sm text-tinta-suave">
              Cadastrem o primeiro com nome e valor em reais. Pode ser um item da casa ou uma cota da lua de mel.
            </p>
            <button type="button" onClick={() => setIsModalOpen(true)} className={`${estiloDoBotao.primary} mt-5`}>
              Cadastrar o primeiro presente
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-4">
            {gifts.map((gift) => (
              <li key={gift.id} className={`${estiloDoCartao} flex flex-col gap-2 p-3`}>
                <div className="relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-areia text-xs text-tinta-suave">
                  {gift.imageUrl ? (
                    <ImagemDaPessoa src={gift.imageUrl} alt="" sizes="(min-width: 640px) 180px, 50vw" className="object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-1">
                      <ImageOff className="size-6" aria-hidden="true" />
                      Sem foto
                    </span>
                  )}
                </div>
                <strong className="line-clamp-2 text-[15px] font-semibold leading-5 text-tinta">{gift.title}</strong>
                {gift.isPurchased ? (
                  <span className="text-sm font-semibold text-sucesso">Presenteado · {formatarReaisEnxuto(gift.amount)}</span>
                ) : (
                  <span className="text-sm text-tinta-suave">{formatarReaisEnxuto(gift.amount)} · disponível</span>
                )}
                {!gift.isPurchased && (
                  <BotaoComCarregamento
                    aria-label={`Excluir ${gift.title}`}
                    onClick={() => handleDelete(gift.id)}
                    loading={isPending && deletingId === gift.id}
                    disabled={isPending}
                    className={`${estiloDoBotao.quiet} ${estiloDoBotao.sm} self-start text-perigo hover:bg-perigo-suave`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Excluir
                  </BotaoComCarregamento>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ModalDoPresente
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <ModalDeConfirmacao
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          confirmAction?.()
        }}
        title="Excluir presente"
        description="Excluir este presente da lista do site? Não dá para desfazer."
      />
    </div>
  )
}
