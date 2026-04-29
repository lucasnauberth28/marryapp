// src/actions/honeymoon-actions.ts
'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getHoneymoonItems() {
  return await prisma.honeymoonItem.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function createHoneymoonItem(formData: FormData) {
  const title = formData.get('title') as string
  const category = formData.get('category') as string
  const amountString = formData.get('amount') as string
  const isPaid = formData.get('isPaid') === 'on' || formData.get('isPaid') === 'true'
  
  // Conversão segura para centavos (estilo fintech)
  const amountInCents = Math.round(parseFloat(amountString) * 100)

  await prisma.honeymoonItem.create({
    data: {
      title,
      category,
      amount: amountInCents,
      isPaid
    }
  })

  revalidatePath('/lua-de-mel')
}

export async function toggleHoneymoonItemStatus(id: string, isPaid: boolean) {
  await prisma.honeymoonItem.update({
    where: { id },
    data: { isPaid }
  })
  revalidatePath('/lua-de-mel')
}

export async function deleteHoneymoonItem(id: string) {
  await prisma.honeymoonItem.delete({ where: { id } })
  revalidatePath('/lua-de-mel')
}