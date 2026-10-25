import "server-only";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { filtroSemSoPresente } from "@/lib/guest-origin";

export interface ContagensDoMenu {
  /** Convidados cadastrados. */
  guests: number;
  /** Convidados que ainda não responderam (quem receberia um lembrete). */
  messages: number;
  /** Tarefas em aberto. */
  tasks: number;
  /** Pedidos de domínio aguardando o registro (só a administração da plataforma vê). */
  domains: number;
}

/**
 * Contadores do menu do painel, sempre do casamento da sessão (uma leitura por request).
 * `platformAdmin` (acesso total) também conta os pedidos de domínio aguardando, que são da plataforma.
 */
export const obterContagensDoMenu = cache(async (weddingId: string, platformAdmin = false): Promise<ContagensDoMenu> => {
  try {
    const [guests, messages, tasks, domains] = await Promise.all([
      prisma.guest.count({ where: { weddingId } }),
      prisma.guest.count({ where: { weddingId, rsvpStatus: "PENDING", ...filtroSemSoPresente } }),
      prisma.task.count({ where: { weddingId, status: { not: "DONE" } } }),
      platformAdmin ? prisma.domainOrder.count({ where: { status: "REQUESTED" } }) : Promise.resolve(0),
    ]);
    return { guests, messages, tasks, domains };
  } catch (error) {
    console.error("[getNavCounts]", error);
    return { guests: 0, messages: 0, tasks: 0, domains: 0 };
  }
});
