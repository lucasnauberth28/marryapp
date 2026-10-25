"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { obterSessao, ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { conferirLimiteDeUso, limitarUsoPorIp } from "@/lib/security/rate-limiter";
import { normalizarTexto } from "@/lib/security/sanitize";
import { MENSAGEM_DA_SITUACAO_DO_CONVITE, buscarConvite } from "@/lib/account/invites";
import { ehViolacaoDeUnicidade } from "@/lib/prisma-erros";
import { classificarConta, renovarCookieDeSessao, criarOuAtualizarPapelDoCasal } from "@/lib/account/wedding-provisioning";
import { registrarAuditoria } from "@/lib/audit";

import { ERROS } from "@/lib/mensagens-de-erro";
type Falha = { success: false; error: string };
export type ResultadoDoAceiteDoConvite =
  | { success: true; redirectTo: string }
  | { success: false; needsConfirm: true; currentCoupleNames: string; willDeleteCurrent: boolean }
  | Falha;

class ConviteJaUsado extends Error {}

function carregarContaDoConvite(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      weddingId: true,
      partnerVendorId: true,
      role: { select: { name: true, allowedPaths: true } },
      wedding: { select: { coupleNames: true } },
    },
  });
}

type ConviteValido = { id: string; weddingId: string };

/** Marca o convite como usado (só uma vez), passa a conta ao perfil "Casal" do casamento e, se era a última pessoa do casamento antigo, apaga o antigo. */
async function moverContaParaOCasamento(userId: string, invite: ConviteValido, previousWeddingId: string | null, willDeleteCurrent: boolean) {
  await prisma.$transaction(async (tx) => {
    const now = new Date();
    const claimed = await tx.weddingInvite.updateMany({ where: { id: invite.id, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now, usedById: userId } });
    if (claimed.count !== 1) throw new ConviteJaUsado();

    const role = await criarOuAtualizarPapelDoCasal(tx);
    await tx.user.update({ where: { id: userId }, data: { weddingId: invite.weddingId, roleId: role.id } });

    if (previousWeddingId && willDeleteCurrent) {
      const stillAlone = (await tx.user.count({ where: { weddingId: previousWeddingId } })) === 0;
      if (stillAlone) {
        await tx.transaction.deleteMany({ where: { weddingId: previousWeddingId } });
        await tx.wedding.delete({ where: { id: previousWeddingId } });
      }
    }
  });
}

/**
 * Conta logada entra no casamento do convite (perfil "Casal").
 * Se a conta já tem outro casamento, pede confirmação antes; sendo o último membro dele,
 * o casamento antigo é excluído junto (e o aviso diz isso).
 */
export async function aceitarConvite(input: { token: string; confirmLeave?: boolean }): Promise<ResultadoDoAceiteDoConvite> {
  const session = await obterSessao();
  if (!session) return { success: false, error: "Entre na sua conta para aceitar o convite." };
  if (session.userId === ID_DO_SUPER_ADMIN) return { success: false, error: "A conta de emergência não pode entrar em um casamento." };

  const limit = await conferirLimiteDeUso({ key: `INVITE_ACCEPT:${session.userId}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (!limit.success) return { success: false, error: ERROS.muitasTentativas };

  const lookup = await buscarConvite(input?.token);
  if (lookup.status !== "ok") return { success: false, error: MENSAGEM_DA_SITUACAO_DO_CONVITE[lookup.status] };
  const { invite } = lookup;

  const user = await carregarContaDoConvite(session.userId);
  if (!user) return { success: false, error: "Conta não encontrada." };

  const kind = classificarConta(user);
  if (kind === "vendor") return { success: false, error: "Contas de fornecedor não entram em casamentos. Crie uma conta pessoal com outro e-mail." };
  if (kind === "admin") return { success: false, error: "Contas da administração não entram em casamentos por convite." };
  if (user.weddingId === invite.weddingId) return { success: true, redirectTo: "/dashboard" };

  const previousWeddingId = user.weddingId;
  const otherMembers = previousWeddingId ? await prisma.user.count({ where: { weddingId: previousWeddingId, id: { not: user.id } } }) : 0;
  const willDeleteCurrent = Boolean(previousWeddingId) && otherMembers === 0;

  if (previousWeddingId && input?.confirmLeave !== true) {
    return { success: false, needsConfirm: true, currentCoupleNames: user.wedding?.coupleNames ?? "seu casamento atual", willDeleteCurrent };
  }

  try {
    await moverContaParaOCasamento(user.id, invite, previousWeddingId, willDeleteCurrent);
  } catch (error) {
    if (error instanceof ConviteJaUsado) return { success: false, error: MENSAGEM_DA_SITUACAO_DO_CONVITE.used };
    console.error("[acceptInvite]", error);
    return { success: false, error: "Não conseguimos aceitar o convite agora. Tente de novo em instantes." };
  }

  await renovarCookieDeSessao(user.id);
  await registrarAuditoria({
    action: "wedding.invite_accept",
    targetType: "Wedding",
    targetId: invite.weddingId,
    details: { inviteId: invite.id, previousWeddingId, deletedPreviousWedding: willDeleteCurrent },
  });
  return { success: true, redirectTo: "/dashboard" };
}

const EsquemaDoCadastro = z.object({
  token: z.string().max(100),
  name: z
    .string()
    .transform((v) => normalizarTexto(v))
    .pipe(z.string().min(3, "Informe seu nome completo.").max(120, "Nome longo demais.")),
  email: z.string().trim().toLowerCase().email("Confira o e-mail.").max(200),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(200, "Senha longa demais."),
});

const CONTA_JA_EXISTENTE = "Já existe uma conta com este e-mail. Entre com ela para aceitar o convite.";

/** Marca o convite como usado (só uma vez) e cria a conta do par já dentro do casamento. */
function criarContaNoCasamento(data: { name: string; email: string }, hashedPassword: string, invite: ConviteValido): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const claimed = await tx.weddingInvite.updateMany({ where: { id: invite.id, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } });
    if (claimed.count !== 1) throw new ConviteJaUsado();

    const role = await criarOuAtualizarPapelDoCasal(tx);
    const created = await tx.user.create({
      data: { name: data.name, username: data.email, password: hashedPassword, roleId: role.id, weddingId: invite.weddingId },
      select: { id: true },
    });
    await tx.weddingInvite.update({ where: { id: invite.id }, data: { usedById: created.id } });
    return created.id;
  });
}

/** Cria a conta do par já dentro do casamento do convite e inicia a sessão. */
export async function aceitarConviteComContaNova(input: {
  token: string;
  name: string;
  email: string;
  password: string;
}): Promise<{ success: true; redirectTo: string } | (Falha & { existingAccount?: boolean })> {
  const parsed = EsquemaDoCadastro.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };
  const data = parsed.data;

  const limit = await limitarUsoPorIp("SIGNUP");
  if (!limit.success) return { success: false, error: "Muitos cadastros em pouco tempo. Aguarde alguns minutos." };

  const lookup = await buscarConvite(data.token);
  if (lookup.status !== "ok") return { success: false, error: MENSAGEM_DA_SITUACAO_DO_CONVITE[lookup.status] };
  const { invite } = lookup;

  const existing = await prisma.user.findUnique({ where: { username: data.email }, select: { id: true } });
  if (existing) return { success: false, error: CONTA_JA_EXISTENTE, existingAccount: true };

  const hashed = await bcrypt.hash(data.password, 12);
  let userId: string;
  try {
    userId = await criarContaNoCasamento(data, hashed, invite);
  } catch (error) {
    if (error instanceof ConviteJaUsado) return { success: false, error: MENSAGEM_DA_SITUACAO_DO_CONVITE.used };
    if (ehViolacaoDeUnicidade(error)) return { success: false, error: CONTA_JA_EXISTENTE, existingAccount: true };
    console.error("[acceptInviteWithNewAccount]", error);
    return { success: false, error: "Não conseguimos criar a conta agora. Tente de novo em instantes." };
  }

  await renovarCookieDeSessao(userId);
  await registrarAuditoria({
    action: "wedding.invite_accept",
    targetType: "Wedding",
    targetId: invite.weddingId,
    actor: { id: userId, name: data.name },
    details: { inviteId: invite.id, newAccount: true },
  });
  return { success: true, redirectTo: "/dashboard" };
}
