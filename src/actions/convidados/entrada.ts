"use server";

// Convidados: registrar a entrada na festa (credenciamento por QR Code ou nome).
import { exigirCasamento } from "@/lib/security/wedding-context";
import { recusaDeModulo } from "@/lib/casamento/wedding-plan";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ERROS } from "@/lib/mensagens-de-erro";

export async function registrarEntradaDoConvidado(guestId: string) {
  const { weddingId, session } = await exigirCasamento("/credenciamento");
  const refusal = await recusaDeModulo({ weddingId, session }, "qrcode");
  if (refusal) return { success: false, error: refusal };
  try {
    if (typeof guestId !== "string") return { success: false, error: ERROS.convidadoNaoEncontrado };
    const guest = await prisma.guest.findFirst({ where: { id: guestId, weddingId } });
    if (!guest) return { success: false, error: ERROS.convidadoNaoEncontrado };

    if (guest.isPresent) {
      return { success: false, error: "A entrada deste convidado já foi registrada antes." };
    }

    // Só o primeiro check-in vale (dois leitores lendo o mesmo QR ao mesmo tempo)
    const result = await prisma.guest.updateMany({
      where: { id: guest.id, weddingId, isPresent: false },
      data: {
        isPresent: true,
        checkInTime: new Date(),
      },
    });
    if (result.count === 0) {
      return { success: false, error: "A entrada deste convidado já foi registrada antes." };
    }

    revalidatePath("/convidados");
    revalidatePath("/dashboard");
    return { success: true, guestName: guest.name };
  } catch (error) {
    console.error("[checkInGuest]", error);
    return { success: false, error: "Não deu para registrar a entrada. Tente de novo." };
  }
}
