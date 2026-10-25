import "server-only";
import prisma from "@/lib/prisma";
import { calcularHashDoTokenDeLink, tokenDeLinkTemFormatoValido } from "@/lib/account/tokens";

export const VALIDADE_DO_CONVITE_EM_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
/** Convites pendentes ao mesmo tempo por casamento. */
export const MAXIMO_DE_CONVITES_PENDENTES = 5;

export type BuscaDeConvite =
  | { status: "ok"; invite: { id: string; weddingId: string; coupleNames: string; expiresAt: Date } }
  | { status: "invalid" | "expired" | "used" };

/** Resolve o convite pelo token do link (só o hash é consultado). */
export async function buscarConvite(token: unknown): Promise<BuscaDeConvite> {
  if (!tokenDeLinkTemFormatoValido(token)) return { status: "invalid" };
  const invite = await prisma.weddingInvite.findUnique({
    where: { tokenHash: calcularHashDoTokenDeLink(token) },
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

export const MENSAGEM_DA_SITUACAO_DO_CONVITE: Record<Exclude<BuscaDeConvite["status"], "ok">, string> = {
  invalid: "Este convite não existe ou o link foi copiado pela metade.",
  expired: "Este convite expirou. Peça um novo para quem convidou você.",
  used: "Este convite já foi usado. Se foi você, é só entrar na sua conta.",
};
