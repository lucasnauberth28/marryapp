'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { uploadGiftImage } from "@/lib/supabase"

const GiftSchema = z.object({
  title: z.string().min(2, "O título deve ter ao menos 2 caracteres.").trim(),
  description: z.string().optional(),
  amount: z.coerce.number().min(100, "O valor mínimo é R$ 1,00."), // em centavos
})

export async function getGifts() {
  try {
    const gifts = await prisma.gift.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: gifts }
  } catch (error) {
    console.error("Erro ao buscar presentes:", error)
    return { success: false, error: "Falha ao carregar presentes." }
  }
}

export async function createGiftAction(formData: FormData) {
  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    amount: formData.get('amount'), // digitado em reais, convertido no client ou aqui? Vamos converter aqui se vier com ponto
  }

  // Se o amount veio como string de reais (ex: "150.50"), convertemos para centavos
  const amountStr = formData.get('amount') as string
  let amountInCents = 0
  if (amountStr) {
    amountInCents = Math.round(parseFloat(amountStr.replace(',', '.')) * 100)
  }

  const parsed = GiftSchema.safeParse({ ...raw, amount: amountInCents })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  // Upload da Imagem
  const imageFile = formData.get('image') as File
  let imageUrl: string | null = null

  if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadGiftImage(imageFile)
  }

  try {
    const gift = await prisma.gift.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        amount: amountInCents,
        imageUrl,
      }
    })

    revalidatePath('/presentes')
    revalidatePath('/presentes-admin')
    return { success: true, data: gift }
  } catch (error) {
    console.error("Erro ao criar presente:", error)
    return { success: false, error: "Falha ao salvar no banco" }
  }
}

export async function deleteGift(id: string) {
  try {
    await prisma.gift.delete({ where: { id } })
    revalidatePath('/presentes')
    revalidatePath('/presentes-admin')
    return { success: true }
  } catch (error) {
    console.error("Erro ao deletar presente:", error)
    return { success: false, error: "Falha ao excluir presente." }
  }
}