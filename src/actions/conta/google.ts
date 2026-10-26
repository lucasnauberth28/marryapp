"use server";

// Minha conta: criar senha (conta que entrou só com o Google) e desconectar o Google.
import prisma from "@/lib/prisma";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { registrarAuditoria } from "@/lib/audit";
import { enviarLinkDeRedefinicaoDeSenha } from "@/lib/account/password-reset-link";
import { ERROS } from "@/lib/mensagens-de-erro";
import { type Falha, SEM_SESSAO, UM_MINUTO_EM_MS, contaAtual } from "@/actions/conta/comum";

const PROVEDOR_GOOGLE = "google";

/**
 * Quem entrou só com o Google não tem senha para "trocar": recebe no e-mail da conta o mesmo link de criar senha
 * do "esqueci a senha". Criar a senha exige acesso à caixa de e-mail, não só à sessão aberta.
 */
export async function enviarLinkParaCriarSenha(): Promise<{ success: true } | Falha> {
  const user = await contaAtual();
  if (!user) return SEM_SESSAO;
  if (user.hasPassword) return { success: false, error: "Sua conta já tem senha. Use “Trocar senha”." };

  const limit = await conferirLimiteDeUso({ key: `ACCOUNT_CREATE_PASSWORD:${user.id}`, limit: 3, windowMs: 60 * UM_MINUTO_EM_MS });
  if (!limit.success) return { success: false, error: ERROS.muitasTentativas };

  const dono = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, username: true } });
  if (!dono) return SEM_SESSAO;
  const { sent } = await enviarLinkDeRedefinicaoDeSenha(dono);
  if (!sent) return { success: false, error: "Não conseguimos enviar o e-mail agora. Tente de novo em instantes." };
  return { success: true };
}

/** Tira o Google da conta. Só com senha criada: senão a pessoa ficaria sem nenhum jeito de entrar. */
export async function desconectarGoogle(): Promise<{ success: true } | Falha> {
  const user = await contaAtual();
  if (!user) return SEM_SESSAO;
  if (!user.hasPassword) return { success: false, error: "Crie uma senha antes de desconectar o Google, senão você ficaria sem como entrar." };

  const { count } = await prisma.externalAccount.deleteMany({ where: { userId: user.id, provider: PROVEDOR_GOOGLE } });
  if (count > 0) await registrarAuditoria({ action: "account.google_unlink", targetType: "User", targetId: user.id });
  return { success: true };
}
