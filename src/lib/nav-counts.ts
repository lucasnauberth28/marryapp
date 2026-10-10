import "server-only";
import { cache } from "react";
import prisma from "@/lib/prisma";

export interface NavCounts {
  /** Convidados cadastrados. */
  guests: number;
  /** Convidados que ainda não responderam (quem receberia um lembrete). */
  messages: number;
  /** Tarefas em aberto. */
  tasks: number;
}

/** Contadores do menu do painel, sempre do casamento da sessão (uma leitura por request). */
export const getNavCounts = cache(async (weddingId: string): Promise<NavCounts> => {
  try {
    const [guests, messages, tasks] = await Promise.all([
      prisma.guest.count({ where: { weddingId } }),
      prisma.guest.count({ where: { weddingId, rsvpStatus: "PENDING" } }),
      prisma.task.count({ where: { weddingId, status: { not: "DONE" } } }),
    ]);
    return { guests, messages, tasks };
  } catch (error) {
    console.error("[getNavCounts]", error);
    return { guests: 0, messages: 0, tasks: 0 };
  }
});
