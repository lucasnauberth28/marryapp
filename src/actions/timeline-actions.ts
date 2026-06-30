"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTimelineEvents() {
  return prisma.timelineEvent.findMany({
    orderBy: [{ position: "asc" }, { time: "asc" }],
  });
}

export async function createTimelineEvent(data: { title: string; time: string; description?: string; icon: string; position: number }) {
  try {
    await prisma.timelineEvent.create({ data });
    revalidatePath("/cronograma");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Erro ao criar evento do cronograma." };
  }
}

export async function updateTimelineEvent(id: string, data: { title: string; time: string; description?: string; icon: string; position: number }) {
  try {
    await prisma.timelineEvent.update({ where: { id }, data });
    revalidatePath("/cronograma");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Erro ao atualizar evento." };
  }
}

export async function deleteTimelineEvent(id: string) {
  try {
    await prisma.timelineEvent.delete({ where: { id } });
    revalidatePath("/cronograma");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Erro ao deletar evento." };
  }
}
