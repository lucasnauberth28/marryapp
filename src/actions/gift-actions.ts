'use server'

import { requirePathPermission } from "@/lib/security/auth-guard"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { uploadGiftImage } from "@/lib/supabase"

const GiftSchema = z.object({
  title: z.string().min(2, "O título deve ter ao menos 2 caracteres.").max(120).trim(),
  description: z.string().max(1000).optional(),
  amount: z.coerce.number().int().min(100, "O valor mínimo é R$ 1,00.").max(100_000_00, "Valor acima do permitido."), // em centavos
})

// Pública: usada pela lista de presentes dos convidados. Retorna apenas campos exibíveis.
export async function getGifts() {
  try {
    const gifts = await prisma.gift.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        amount: true,
        imageUrl: true,
        isPurchased: true,
        createdAt: true,
      },
    })
    return { success: true, data: gifts }
  } catch (error) {
    console.error("Erro ao buscar presentes:", error)
    return { success: false, error: "Falha ao carregar presentes." }
  }
}

export async function createGiftAction(formData: FormData) {
  await requirePathPermission("/presentes-admin")

  // O valor chega digitado em reais (ex: "150,50") e é convertido para centavos
  const amountStr = formData.get('amount')
  const amountInCents = typeof amountStr === 'string' && amountStr
    ? Math.round(parseFloat(amountStr.replace(',', '.')) * 100)
    : 0

  const parsed = GiftSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    amount: amountInCents,
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const imageFile = formData.get('image')
  let imageUrl: string | null = null

  if (imageFile instanceof File && imageFile.size > 0) {
    const upload = await uploadGiftImage(imageFile)
    if (!upload.success) return { success: false, error: upload.error }
    imageUrl = upload.url
  }

  try {
    const gift = await prisma.gift.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        amount: parsed.data.amount,
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
  await requirePathPermission("/presentes-admin")

  try {
    // Presentes com pagamentos aprovados não podem ser apagados: o histórico financeiro precisa ser preservado.
    const approved = await prisma.transaction.count({
      where: { giftId: id, status: "APPROVED" },
    })
    if (approved > 0) {
      return { success: false, error: "Este presente já recebeu pagamentos aprovados e não pode ser excluído." }
    }

    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { giftId: id } }),
      prisma.gift.delete({ where: { id } }),
    ])

    revalidatePath('/presentes')
    revalidatePath('/presentes-admin')
    revalidatePath('/(admin)/presentes-admin', 'page')
    revalidatePath('/(admin)/dashboard', 'page')
    revalidatePath('/(admin)/financas', 'page')
    return { success: true }
  } catch (error) {
    console.error("Erro ao deletar presente:", error)
    return { success: false, error: "Falha ao excluir presente." }
  }
}
