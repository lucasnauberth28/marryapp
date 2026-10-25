"use server";

import { exigirCasamento, exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";
import { obterLinhaDoTempoDoCasamento } from "@/lib/wedding-data";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ERROS } from "@/lib/mensagens-de-erro";
// Campos que o cronograma pode gravar. Qualquer outro campo enviado (ex.: weddingId) é ignorado.
const EsquemaDoEventoDaLinhaDoTempo = z.object({
  title: z.string().trim().min(1, "Informe o título do evento.").max(160),
  time: z.string().trim().min(1, "Informe o horário.").max(20),
  description: z.string().trim().max(2000).optional(),
  icon: z.string().trim().max(60).default("Clock"),
  position: z.coerce.number().int().default(0),
});

type EntradaDoEventoDaLinhaDoTempo = { title: string; time: string; description?: string; icon: string; position: number };

/** Cronograma do casamento da sessão (painel). O público lê pelo endereço do casamento. */
export async function obterEventosDaLinhaDoTempo() {
  const { weddingId } = await exigirCasamentoParaLeitura("/cronograma");
  return obterLinhaDoTempoDoCasamento(weddingId);
}

export async function criarEventoDaLinhaDoTempo(data: EntradaDoEventoDaLinhaDoTempo) {
  const { weddingId } = await exigirCasamento("/cronograma");
  const parsed = EsquemaDoEventoDaLinhaDoTempo.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  try {
    await prisma.timelineEvent.create({ data: { ...parsed.data, weddingId } });
    revalidatePath("/cronograma");
    revalidatePath("/casamento", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Não deu para adicionar o horário. Tente de novo." };
  }
}

export async function atualizarEventoDaLinhaDoTempo(id: string, data: EntradaDoEventoDaLinhaDoTempo) {
  const { weddingId } = await exigirCasamento("/cronograma");
  if (typeof id !== "string") return { success: false, error: ERROS.horarioNaoEncontrado };
  const parsed = EsquemaDoEventoDaLinhaDoTempo.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  try {
    const result = await prisma.timelineEvent.updateMany({ where: { id, weddingId }, data: parsed.data });
    if (result.count === 0) return { success: false, error: ERROS.horarioNaoEncontrado };
    revalidatePath("/cronograma");
    revalidatePath("/casamento", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Não deu para salvar o horário. Tente de novo." };
  }
}

export async function excluirEventoDaLinhaDoTempo(id: string) {
  const { weddingId } = await exigirCasamento("/cronograma");
  try {
    if (typeof id !== "string") return { success: false, error: ERROS.horarioNaoEncontrado };
    const result = await prisma.timelineEvent.deleteMany({ where: { id, weddingId } });
    if (result.count === 0) return { success: false, error: ERROS.horarioNaoEncontrado };
    revalidatePath("/cronograma");
    revalidatePath("/casamento", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Não deu para excluir o horário. Tente de novo." };
  }
}
