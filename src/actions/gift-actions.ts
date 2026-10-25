'use server'

import { exigirCasamento, exigirCasamentoParaLeitura } from "@/lib/security/wedding-context"
import { obterPresentesDoCasamento } from "@/lib/casamento/wedding-data"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { enviarImagemDoPresente } from "@/lib/supabase"

import { ERROS } from "@/lib/mensagens-de-erro";
const EsquemaDoPresente = z.object({
  title: z.string().min(2, "O título deve ter ao menos 2 caracteres.").max(120).trim(),
  description: z.string().max(1000).optional(),
  amount: z.coerce.number().int().min(100, "O valor mínimo é R$ 1,00.").max(100_000_00, "Valor acima do permitido."), // em centavos
})

// Painel do casal: presentes do casamento da sessão. A lista pública (/casamento/<slug>/presentes)
// lê direto no servidor pelo casamento do endereço (lib/wedding-data).
export async function obterPresentes() {
  const { weddingId } = await exigirCasamentoParaLeitura("/presentes-admin")
  try {
    const gifts = await obterPresentesDoCasamento(weddingId)
    return { success: true, data: gifts }
  } catch (error) {
    console.error("Erro ao buscar presentes:", error)
    return { success: false, error: "Não deu para carregar os presentes. Tente de novo." }
  }
}

export async function criarPresente(formData: FormData) {
  const { weddingId } = await exigirCasamento("/presentes-admin")

  // O valor chega digitado em reais (ex: "150,50") e é convertido para centavos
  const amountStr = formData.get('amount')
  const amountInCents = typeof amountStr === 'string' && amountStr
    ? Math.round(parseFloat(amountStr.replace(',', '.')) * 100)
    : 0

  const parsed = EsquemaDoPresente.safeParse({
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
    const upload = await enviarImagemDoPresente(imageFile)
    if (!upload.success) return { success: false, error: upload.error }
    imageUrl = upload.url
  }

  try {
    const gift = await prisma.gift.create({
      data: {
        weddingId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        amount: parsed.data.amount,
        imageUrl,
      }
    })

    revalidatePath('/casamento', 'layout')
    revalidatePath('/presentes-admin')
    return { success: true, data: gift }
  } catch (error) {
    console.error("Erro ao criar presente:", error)
    return { success: false, error: "Não deu para cadastrar o presente. Tente de novo." }
  }
}

export async function excluirPresente(id: string) {
  const { weddingId } = await exigirCasamento("/presentes-admin")

  try {
    if (typeof id !== "string") return { success: false, error: ERROS.presenteNaoEncontrado }
    const gift = await prisma.gift.findFirst({ where: { id, weddingId }, select: { id: true } })
    if (!gift) return { success: false, error: ERROS.presenteNaoEncontrado }

    // Presentes com pagamentos aprovados não podem ser apagados: o histórico financeiro precisa ser preservado.
    const approved = await prisma.transaction.count({
      where: { giftId: gift.id, weddingId, status: "APPROVED" },
    })
    if (approved > 0) {
      return { success: false, error: "Este presente já recebeu pagamentos aprovados e não pode ser excluído." }
    }

    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { giftId: gift.id, weddingId } }),
      prisma.gift.deleteMany({ where: { id: gift.id, weddingId } }),
    ])

    revalidatePath('/casamento', 'layout')
    revalidatePath('/presentes-admin')
    revalidatePath('/(admin)/presentes-admin', 'page')
    revalidatePath('/(admin)/dashboard', 'page')
    revalidatePath('/(admin)/financas', 'page')
    return { success: true }
  } catch (error) {
    console.error("Erro ao deletar presente:", error)
    return { success: false, error: "Não deu para excluir o presente. Tente de novo." }
  }
}
