import "server-only";
import prisma from "@/lib/prisma";

export const SITE_UNAVAILABLE_MESSAGE = "Este site está indisponível no momento.";

/** Casamento suspenso pela administração? Para ações públicas (RSVP, presentes, recados), que acham o casamento pelo presente ou pelo endereço. */
export async function isWeddingSuspended(weddingId: string): Promise<boolean> {
  const row = await prisma.wedding.findUnique({ where: { id: weddingId }, select: { suspendedAt: true } });
  return Boolean(row?.suspendedAt);
}
