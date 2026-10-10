"use client"

import { useId, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CustomModal } from "@/components/ui/custom-modal"
import { createGiftAction } from "@/actions/gift-actions"
import { ImagePlus, Loader2 } from "lucide-react"

interface GiftModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GiftModal({ isOpen, onClose }: GiftModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const uid = useId()

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null)

    const toastId = toast.loading("Cadastrando presente na vitrine virtual...")
    startTransition(async () => {
      const result = await createGiftAction(formData)

      if (result.success) {
        toast.success("Presente cadastrado com sucesso na vitrine! 🎁", { id: toastId })
        setImagePreview(null)
        onClose()
      } else {
        toast.error(result.error ?? "Erro ao criar o presente.", { id: toastId })
        setError(result.error ?? "Erro ao criar o presente.")
      }
    })
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo presente"
      description="Ele aparece na lista de presentes do site de vocês."
      size="md"
    >
      <form action={handleSubmit} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <span id={`${uid}-img`} className="text-sm font-semibold text-tinta">
            Foto do presente <span className="font-normal text-tinta-suave">(opcional)</span>
          </span>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-linha-forte border-dashed rounded-xl cursor-pointer hover:bg-zinc-50/50 transition-colors relative overflow-hidden focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ameixa">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Prévia da foto escolhida"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImagePlus className="w-8 h-8 text-zinc-500 mb-2" />
                  <p className="text-sm text-zinc-500 font-medium">
                    Toque para escolher uma foto
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    JPG, PNG ou WEBP
                  </p>
                </div>
              )}
              <input
                type="file"
                name="image"
                accept="image/*"
                aria-labelledby={`${uid}-img`}
                className="sr-only"
                onChange={handleImageChange}
              />
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${uid}-title`} className="text-sm font-semibold text-tinta">
            Nome do presente
          </label>
          <Input
            id={`${uid}-title`}
            name="title"
            placeholder="Ex.: Jogo de panelas"
            required
            className="h-11 sm:h-10"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${uid}-amount`} className="text-sm font-semibold text-tinta">
            Valor em reais
          </label>
          <Input
            id={`${uid}-amount`}
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="Ex.: 150,00"
            required
            aria-describedby={`${uid}-amount-dica`}
            className="h-11 sm:h-10"
          />
          <p id={`${uid}-amount-dica`} className="text-xs text-tinta-suave">
            Quanto o convidado paga pelo presente. Ele escolhe Pix ou cartão.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${uid}-desc`} className="text-sm font-semibold text-tinta">
            Recado para os convidados <span className="font-normal text-tinta-suave">(opcional)</span>
          </label>
          <Textarea
            id={`${uid}-desc`}
            name="description"
            placeholder="Uma mensagem carinhosa ou detalhes sobre o presente"
            className="min-h-[100px]"
          />
        </div>

        {error && (
          <p className="text-sm text-perigo bg-perigo-suave border border-perigo/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="h-11 px-4 sm:h-9">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="h-11 gap-2 bg-zinc-900 px-4 text-white hover:bg-zinc-800 shadow-sm sm:h-9"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "Salvando..." : "Adicionar presente"}
          </Button>
        </div>
      </form>
    </CustomModal>
  )
}
