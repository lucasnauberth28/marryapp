import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { ehViolacaoDeUnicidade } from "@/lib/prisma-erros";
import { normalizarTexto } from "@/lib/security/sanitize";
import { buscarConvite } from "@/lib/account/invites";
import { criarOuAtualizarPapelDoCasal } from "@/lib/account/wedding-provisioning";
import type { PerfilDoGoogle } from "@/lib/google/cookies";

class ConviteJaUsado extends Error {}

/**
 * Quem chegou do Google pelo link de convite do par, sem conta: nasce já dentro do casamento convidado (perfil "Casal"),
 * ligada ao Google e sem senha. Devolve o id da conta, ou null se o convite não vale mais (a tela do convite explica).
 */
export async function criarContaDoParComGoogle(perfil: PerfilDoGoogle, token: string): Promise<string | null> {
  const busca = await buscarConvite(token);
  if (busca.status !== "ok") return null;
  const { invite } = busca;
  const nome = normalizarTexto(perfil.name) || perfil.email.split("@")[0];
  const senhaDescartavel = await bcrypt.hash(randomBytes(32).toString("base64url"), 12);

  let userId: string;
  try {
    userId = await prisma.$transaction(async (tx) => {
      const agora = new Date();
      const usado = await tx.weddingInvite.updateMany({ where: { id: invite.id, usedAt: null, expiresAt: { gt: agora } }, data: { usedAt: agora } });
      if (usado.count !== 1) throw new ConviteJaUsado();
      const papel = await criarOuAtualizarPapelDoCasal(tx);
      const conta = await tx.user.create({
        data: {
          name: nome,
          username: perfil.email,
          password: senhaDescartavel,
          hasPassword: false,
          roleId: papel.id,
          weddingId: invite.weddingId,
          externalAccounts: { create: { provider: "google", providerAccountId: perfil.sub, email: perfil.email } },
        },
        select: { id: true },
      });
      await tx.weddingInvite.update({ where: { id: invite.id }, data: { usedById: conta.id } });
      return conta.id;
    });
  } catch (error) {
    if (error instanceof ConviteJaUsado || ehViolacaoDeUnicidade(error)) return null;
    throw error;
  }

  await registrarAuditoria({ action: "wedding.invite_accept", targetType: "Wedding", targetId: invite.weddingId, actor: { id: userId, name: nome }, details: { inviteId: invite.id, newAccount: true, google: true } });
  return userId;
}
