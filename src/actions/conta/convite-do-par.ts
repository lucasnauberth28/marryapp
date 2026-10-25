"use server";

// Minha conta: convidar (e cancelar o convite de) a pessoa parceira.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { gerarTokenDeLink } from "@/lib/account/tokens";
import { VALIDADE_DO_CONVITE_EM_MS, MAXIMO_DE_CONVITES_PENDENTES } from "@/lib/account/invites";
import { emailDaMarca, enviarEmail } from "@/lib/email/email";
import { urlDoApp } from "@/lib/app-url";
import { registrarAuditoria } from "@/lib/audit";
import { type Falha, SEM_SESSAO, UM_MINUTO_EM_MS, contaAtual } from "@/actions/conta/comum";

const EsquemaDoConvite = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Confira o e-mail.")
    .optional(),
});

export type ResultadoDaCriacaoDoConvite =
  | { success: true; path: string; expiresAt: string; email: string | null; emailSent: boolean; invite: ConvitePendente }
  | Falha;

export interface ConvitePendente {
  id: string;
  email: string | null;
  createdAt: string;
  expiresAt: string;
}

/** Manda o convite ao e-mail informado. Devolve true se o e-mail saiu. */
async function enviarConviteDoParPorEmail(email: string, nomeDeQuemConvida: string, coupleNames: string, path: string): Promise<boolean> {
  const firstName = nomeDeQuemConvida.trim().split(/\s+/)[0] || "Seu par";
  const { html, text } = emailDaMarca({
    heading: `${firstName} convidou você`,
    preheader: `Entre no casamento ${coupleNames} no Aceito.`,
    paragraphs: [
      `${firstName} está organizando o casamento ${coupleNames} no Aceito e quer você junto: convidados, site, presentes e tudo mais, num lugar só.`,
      "Aceite o convite para entrar com a sua própria conta.",
    ],
    cta: { label: "Aceitar o convite", url: urlDoApp(path) },
    footnotes: ["O convite vale por 7 dias e só pode ser usado uma vez.", "Se você não esperava este convite, pode ignorar este e-mail."],
  });
  return (await enviarEmail({ to: email, subject: `${firstName} convidou você para o casamento no Aceito`, html, text })).sent;
}

/**
 * Cria um convite (7 dias) para o par entrar no casamento. O link /convite/<token> só existe
 * nesta resposta: o banco guarda apenas o hash. Com e-mail informado, envia o convite também.
 */
export async function criarConviteDePessoaParceira(input: { email?: string }): Promise<ResultadoDaCriacaoDoConvite> {
  const user = await contaAtual();
  if (!user) return SEM_SESSAO;
  if (user.kind !== "couple" || !user.wedding) return { success: false, error: "Só contas de casal podem convidar o par." };

  const parsed = EsquemaDoConvite.safeParse(input ?? {});
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira o e-mail." };
  const email = parsed.data.email || null;

  const limit = await conferirLimiteDeUso({ key: `WEDDING_INVITE:${user.id}`, limit: 10, windowMs: 60 * UM_MINUTO_EM_MS });
  if (!limit.success) return { success: false, error: "Muitos convites em pouco tempo. Aguarde um pouco." };

  const now = new Date();
  const pending = await prisma.weddingInvite.count({ where: { weddingId: user.wedding.id, usedAt: null, expiresAt: { gt: now } } });
  if (pending >= MAXIMO_DE_CONVITES_PENDENTES) {
    return { success: false, error: `Já há ${MAXIMO_DE_CONVITES_PENDENTES} convites pendentes. Cancele algum antes de criar outro.` };
  }

  const { token, tokenHash } = gerarTokenDeLink();
  const invite = await prisma.weddingInvite.create({
    data: { weddingId: user.wedding.id, tokenHash, email, createdById: user.id, expiresAt: new Date(now.getTime() + VALIDADE_DO_CONVITE_EM_MS) },
    select: { id: true, email: true, createdAt: true, expiresAt: true },
  });
  const path = `/convite/${token}`;

  const emailSent = email ? await enviarConviteDoParPorEmail(email, user.name, user.wedding.coupleNames, path) : false;

  await registrarAuditoria({ action: "wedding.invite_create", targetType: "WeddingInvite", targetId: invite.id, details: { byEmail: Boolean(email), emailSent } });
  revalidatePath("/conta");

  return {
    success: true,
    path,
    expiresAt: invite.expiresAt.toISOString(),
    email: invite.email,
    emailSent,
    invite: { id: invite.id, email: invite.email, createdAt: invite.createdAt.toISOString(), expiresAt: invite.expiresAt.toISOString() },
  };
}

export async function cancelarConviteDePessoaParceira(inviteId: string): Promise<{ success: true } | Falha> {
  const user = await contaAtual();
  if (!user) return SEM_SESSAO;
  if (!user.wedding) return { success: false, error: "Convite não encontrado." };
  if (!z.string().uuid().safeParse(inviteId).success) return { success: false, error: "Convite não encontrado." };

  const removed = await prisma.weddingInvite.deleteMany({ where: { id: inviteId, weddingId: user.wedding.id, usedAt: null } });
  if (removed.count !== 1) return { success: false, error: "Convite não encontrado ou já usado." };

  await registrarAuditoria({ action: "wedding.invite_cancel", targetType: "WeddingInvite", targetId: inviteId });
  revalidatePath("/conta");
  return { success: true };
}
