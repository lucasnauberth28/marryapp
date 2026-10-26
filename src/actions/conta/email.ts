"use server";

// Minha conta: pedir de novo o link para confirmar o e-mail.
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import prisma from "@/lib/prisma";
import { enviarLinkDeConfirmacaoDeEmail } from "@/lib/account/email-verification";
import { ERROS } from "@/lib/mensagens-de-erro";
import { type Falha, SEM_SESSAO, UM_MINUTO_EM_MS, contaAtual } from "@/actions/conta/comum";

export async function reenviarConfirmacaoDeEmail(): Promise<{ success: true } | Falha> {
  const user = await contaAtual();
  if (!user) return SEM_SESSAO;
  const dono = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, username: true, emailVerifiedAt: true } });
  if (!dono) return SEM_SESSAO;
  if (dono.emailVerifiedAt) return { success: true };

  const limit = await conferirLimiteDeUso({ key: `ACCOUNT_VERIFY_EMAIL:${dono.id}`, limit: 3, windowMs: 60 * UM_MINUTO_EM_MS });
  if (!limit.success) return { success: false, error: ERROS.muitasTentativas };

  const { sent } = await enviarLinkDeConfirmacaoDeEmail(dono);
  if (!sent) return { success: false, error: "Não conseguimos enviar o e-mail agora. Tente de novo em instantes." };
  return { success: true };
}
