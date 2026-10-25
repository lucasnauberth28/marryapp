"use server";

import { exigirCasamento, exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";
import { garantirConfiguracoesDoSistema } from "@/lib/casamento/wedding-data";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/** Regras do casamento da sessão. As páginas públicas leem o prazo pelo endereço (lib/wedding-data). */
export async function obterConfiguracoes() {
  const { weddingId } = await exigirCasamentoParaLeitura();
  return garantirConfiguracoesDoSistema(weddingId);
}

/**
 * Regras do casamento editáveis em Configurações. Aparência e dados exibidos no site
 * ficam em updateSiteCustomization (editor do site).
 */
export async function atualizarConfiguracoes(data: { rsvpDeadline: Date | null }) {
  const { weddingId } = await exigirCasamento("/configuracoes");

  const rsvpDeadline = data?.rsvpDeadline ? new Date(data.rsvpDeadline) : null;
  if (rsvpDeadline && Number.isNaN(rsvpDeadline.getTime())) {
    return { success: false, error: "Data inválida." };
  }

  await prisma.systemSettings.upsert({
    where: { weddingId },
    update: { rsvpDeadline },
    create: { weddingId, rsvpDeadline },
  });

  revalidatePath("/casamento", "layout");
  revalidatePath("/configuracoes");

  return { success: true };
}
