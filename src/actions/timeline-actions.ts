"use server";

import { requireWedding } from "@/lib/security/wedding-context";
import { getWeddingTimeline } from "@/lib/wedding-data";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Campos que o cronograma pode gravar. Qualquer outro campo enviado (ex.: weddingId) é ignorado.
const TimelineEventSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do evento.").max(160),
  time: z.string().trim().min(1, "Informe o horário.").max(20),
  description: z.string().trim().max(2000).optional(),
  icon: z.string().trim().max(60).default("Clock"),
  position: z.coerce.number().int().default(0),
});

type TimelineEventInput = { title: string; time: string; description?: string; icon: string; position: number };

/** Cronograma do casamento da sessão (painel). O público lê pelo endereço do casamento. */
export async function getTimelineEvents() {
  const { weddingId } = await requireWedding("/cronograma");
  return getWeddingTimeline(weddingId);
}

export async function createTimelineEvent(data: TimelineEventInput) {
  const { weddingId } = await requireWedding("/cronograma");
  const parsed = TimelineEventSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  try {
    await prisma.timelineEvent.create({ data: { ...parsed.data, weddingId } });
    revalidatePath("/cronograma");
    revalidatePath("/casamento", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao criar evento do cronograma." };
  }
}

export async function updateTimelineEvent(id: string, data: TimelineEventInput) {
  const { weddingId } = await requireWedding("/cronograma");
  if (typeof id !== "string") return { success: false, error: "Evento não encontrado." };
  const parsed = TimelineEventSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  try {
    const result = await prisma.timelineEvent.updateMany({ where: { id, weddingId }, data: parsed.data });
    if (result.count === 0) return { success: false, error: "Evento não encontrado." };
    revalidatePath("/cronograma");
    revalidatePath("/casamento", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao atualizar evento." };
  }
}

export async function deleteTimelineEvent(id: string) {
  const { weddingId } = await requireWedding("/cronograma");
  try {
    if (typeof id !== "string") return { success: false, error: "Evento não encontrado." };
    const result = await prisma.timelineEvent.deleteMany({ where: { id, weddingId } });
    if (result.count === 0) return { success: false, error: "Evento não encontrado." };
    revalidatePath("/cronograma");
    revalidatePath("/casamento", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao deletar evento." };
  }
}
