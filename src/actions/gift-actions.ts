// src/actions/gift-actions.ts
'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Função para buscar todos os presentes cadastrados
export async function getGifts() {
  try {
    const gifts = await prisma.gift.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return gifts
  } catch (error) {
    console.error("Erro ao buscar presentes:", error)
    return []
  }
}

// Função para criar um novo presente
export async function createGift(formData: FormData) {
  const title = formData.get('title') as string
  const amountString = formData.get('amount') as string
  
  if (!title || !amountString) return { error: "Preencha todos os campos" }

  // Converte o valor digitado (ex: 200.50) para centavos (20050) para o banco
  const amountInCents = Math.round(parseFloat(amountString) * 100)

  try {
    await prisma.gift.create({
      data: {
        title,
        amount: amountInCents,
        description: formData.get('description') as string,
        // imageUrl: aqui depois integraremos o upload do Supabase
      }
    })

    // Limpa o cache da página para mostrar o novo presente instantaneamente
    revalidatePath('/presentes')
    return { success: true }
  } catch (error) {
    console.error("Erro ao criar presente:", error)
    return { error: "Falha ao salvar no banco" }
  }
}