import "server-only";
import prisma from "@/lib/prisma";
import { hashLinkToken, isLinkTokenShape } from "@/lib/account/tokens";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
/** Convites pendentes ao mesmo tempo por casamento. */
export const MAX_PENDING_INVITES = 5;

export type InviteLookup =
  | { status: "ok"; invite: { id: string; weddingId: string; coupleNames: string; expiresAt: Date } }
  | { status: "invalid" | "expired" | "used" };

/** Resolve o convite pelo token do link (só o hash é consultado). */
export async function lookupInvite(token: unknown): Promise<InviteLookup> {
  if (!isLinkTokenShape(token)) return { status: "invalid" };
  const invite = await prisma.weddingInvite.findUnique({
    where: { tokenHash: hashLinkToken(token) },
    select: { id: true, weddingId: true, expiresAt: true, usedAt: true, wedding: { select: { coupleNames: true } } },
  });
  if (!invite) return { status: "invalid" };
  if (invite.usedAt) return { status: "used" };
  if (invite.expiresAt <= new Date()) return { status: "expired" };
  return {
    status: "ok",
    invite: { id: invite.id, weddingId: invite.weddingId, coupleNames: invite.wedding.coupleNames, expiresAt: invite.expiresAt },
  };
}

export const INVITE_STATUS_MESSAGE: Record<Exclude<InviteLookup["status"], "ok">, string> = {
  invalid: "Este convite não existe ou o link foi copiado pela metade.",
  expired: "Este convite expirou. Peça um novo para quem convidou você.",
  used: "Este convite já foi usado. Se foi você, é só entrar na sua conta.",
};
