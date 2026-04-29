"use client"

import { useState, useTransition } from "react"
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

    startTransition(async () => {
      const result = await createGiftAction(formData)

      if (result.success) {
        setImagePreview(null)
        onClose()
      } else {
        setError(result.error ?? "Erro ao criar o presente.")
      }
    })
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Presente"
      description="Cadastre um presente na sua vitrine virtual para os convidados."
      size="md"
    >
      <form action={handleSubmit} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Imagem do Presente
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-zinc-200 border-dashed rounded-xl cursor-pointer hover:bg-zinc-50/50 transition-colors relative overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImagePlus className="w-8 h-8 text-zinc-400 mb-2" />
                  <p className="text-sm text-zinc-500 font-medium">
                    Clique para fazer upload
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    PNG, JPG ou WEBP
                  </p>
                </div>
              )}
              <input
                type="file"
                name="image"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Título
          </label>
          <Input
            name="title"
            placeholder="Ex: Jogo de Panelas Antiaderentes"
            required
            className="bg-white border-zinc-200"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Valor (R$)
          </label>
          <Input
            name="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            className="bg-white border-zinc-200"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Descrição (Opcional)
          </label>
          <Textarea
            name="description"
            placeholder="Uma mensagem carinhosa ou detalhes sobre o presente..."
            className="bg-white border-zinc-200 min-h-[100px]"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "Salvando..." : "Adicionar Presente"}
          </Button>
        </div>
      </form>
    </CustomModal>
  )
}
