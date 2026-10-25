"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { exigirCasamento } from "@/lib/security/wedding-context";

import { ERROS } from "@/lib/mensagens-de-erro";
const InputSchema = z.object({ guestId: z.string().uuid("Convidado não encontrado.") });

export type MarkInviteSharedResult = { success: true } | { success: false; error: string };

/**
 * O casal abriu o WhatsApp de um convidado, com o convite pronto, no próprio aparelho: guarda quando.
 * Só marca (não envia nada): o casal manda a mensagem por lá. O convidado precisa ser deste casamento
 * (nada vem do navegador além do id) e a permissão é a da lista de convidados.
 */
export async function markInviteShared(input: unknown): Promise<MarkInviteSharedResult> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: ERROS.convidadoNaoEncontrado };

  const { weddingId } = await exigirCasamento("/convidados");
  try {
    // updateMany com o casamento no filtro: um id de outro casamento não casa com nada
    const result = await prisma.guest.updateMany({
      where: { id: parsed.data.guestId, weddingId },
      data: { inviteSharedAt: new Date() },
    });
    if (result.count === 0) return { success: false, error: ERROS.convidadoNaoEncontrado };
    return { success: true };
  } catch (error) {
    console.error("[markInviteShared]", error);
    return { success: false, error: "Não deu para anotar o envio. O WhatsApp abriu mesmo assim." };
  }
}
