"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { GiftLocal as Gift } from "@/types/local"
import { deleteGift } from "@/actions/gift-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GiftModal } from "./gift-modal"
import { Trash2, Gift as GiftIcon, DollarSign, ImageOff } from "lucide-react"

interface GiftsClientProps {
  initialGifts: Gift[]
}

export function GiftsClient({ initialGifts }: GiftsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)

  function handleDelete(id: string) {
    setConfirmAction(() => () => {
      startTransition(async () => {
        const result = await deleteGift(id)
        if (!result.success) toast.error(result.error)
        else toast.success("Presente excluído com sucesso!")
      })
    })
    setConfirmOpen(true)
  }

  // Conversão de centavos para Real
  function formatPrice(amount: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100)
  }

  const totalGifts = initialGifts.length
  const totalAmountInCents = initialGifts.reduce((acc, g) => acc + g.amount, 0)
  const purchasedCount = initialGifts.filter(g => g.isPurchased).length

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#8C6D45] font-serif italic tracking-tight">
            Vitrine de Presentes
          </h1>
          <p className="text-zinc-500 mt-1">
            Cadastre os itens que deseja ganhar. Os convidados poderão comprar via Pix ou Cartão.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Novo Presente
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Itens Cadastrados", value: totalGifts, color: "text-zinc-900" },
          { label: "Valor Total da Vitrine", value: formatPrice(totalAmountInCents), color: "text-zinc-900" },
          { label: "Presentes Ganhos", value: purchasedCount, color: "text-emerald-600" },
        ].map((s, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-zinc-200/80 shadow-sm p-5"
          >
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {s.label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Grid de Presentes */}
      {initialGifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-zinc-200/80 rounded-2xl text-zinc-400">
          <GiftIcon className="w-10 h-10 mb-3 text-zinc-200" />
          <p className="font-medium text-zinc-500">Nenhum presente na vitrine</p>
          <p className="text-sm mt-1">Clique em "Novo Presente" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialGifts.map((gift) => (
            <div
              key={gift.id}
              className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-md hover:border-zinc-300"
            >
              {/* Imagem do Presente */}
              <div className="h-48 bg-zinc-100 relative flex items-center justify-center overflow-hidden">
                {gift.imageUrl ? (
                  <img
                    src={gift.imageUrl}
                    alt={gift.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-400">
                    <ImageOff className="w-8 h-8 text-zinc-300 mb-2" />
                    <span className="text-xs">Sem imagem</span>
                  </div>
                )}

                {/* Badge Status */}
                <div className="absolute top-3 right-3">
                  {gift.isPurchased ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-semibold shadow-sm">
                      ✓ Comprado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-zinc-50/90 text-zinc-600 border-zinc-200 font-medium shadow-sm backdrop-blur-sm">
                      Disponível
                    </Badge>
                  )}
                </div>
              </div>

              {/* Informações */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-zinc-900 line-clamp-1 group-hover:text-zinc-950">
                    {gift.title}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1 line-clamp-2 min-h-[40px]">
                    {gift.description || "Sem descrição disponível."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                      Valor
                    </span>
                    <span className="text-xl font-bold text-zinc-900">
                      {formatPrice(gift.amount)}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(gift.id)}
                    disabled={isPending}
                    className="text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-full h-9 w-9"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
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
        title="Excluir Presente"
        description="Deseja realmente excluir este item da vitrine?"
      />
    </div>
  )
}
