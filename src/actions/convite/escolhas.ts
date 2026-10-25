"use server";

// Convite digital: o casal escolhe se o nome do convidado aparece e qual frase vai no convite.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { exigirCasamento } from "@/lib/security/wedding-context";
import { recusaDeModulo } from "@/lib/casamento/wedding-plan";
import { garantirPersonalizacaoDoSite } from "@/lib/casamento/wedding-data";

const EsquemaDasEscolhas = z.object({
  guestName: z.boolean().optional(),
  message: z.string().trim().max(300, "A frase pode ter até 300 caracteres.").nullable().optional(),
});

export interface ResultadoDasEscolhasDoConvite {
  success: boolean;
  error?: string;
}

export async function salvarEscolhasDoConvite(entrada: z.input<typeof EsquemaDasEscolhas>): Promise<ResultadoDasEscolhasDoConvite> {
  const { weddingId, wedding, session } = await exigirCasamento("/mensagens");
  const recusa = await recusaDeModulo({ weddingId, session }, "convite");
  if (recusa) return { success: false, error: recusa };
  const dados = EsquemaDasEscolhas.safeParse(entrada);
  if (!dados.success) return { success: false, error: dados.error.issues[0].message };
  try {
    await garantirPersonalizacaoDoSite(wedding);
    await prisma.siteCustomization.update({
      where: { weddingId },
      data: {
        ...(dados.data.guestName !== undefined ? { inviteGuestName: dados.data.guestName } : {}),
        ...(dados.data.message !== undefined ? { inviteMessage: dados.data.message || null } : {}),
      },
    });
    revalidatePath("/mensagens");
    return { success: true };
  } catch (error) {
    console.error("[salvarEscolhasDoConvite Error]:", error);
    return { success: false, error: "Não deu para salvar. Tente de novo." };
  }
}
