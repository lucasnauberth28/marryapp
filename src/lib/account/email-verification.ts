import "server-only";
import prisma from "@/lib/prisma";
import { calcularHashDoTokenDeLink, gerarTokenDeLink, tokenDeLinkTemFormatoValido } from "@/lib/account/tokens";
import { emailDaMarca, enviarEmail } from "@/lib/email/email";
import { urlDoApp } from "@/lib/app-url";

const VALIDADE_DA_CONFIRMACAO_EM_MS = 24 * 60 * 60 * 1000; // 24 horas

/** Cria o link de confirmação (só o hash vai ao banco, um por vez) e envia ao e-mail da conta. */
export async function enviarLinkDeConfirmacaoDeEmail(user: { id: string; name: string; username: string }): Promise<{ sent: boolean }> {
  const { token, tokenHash } = gerarTokenDeLink();
  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    prisma.emailVerificationToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + VALIDADE_DA_CONFIRMACAO_EM_MS) } }),
  ]);

  const firstName = user.name.trim().split(/\s+/)[0] || "";
  const { html, text } = emailDaMarca({
    heading: "Confirme seu e-mail",
    preheader: "Falta só um toque para confirmar.",
    paragraphs: [`${firstName ? `Olá, ${firstName}. ` : "Olá. "}Toque no botão abaixo para confirmar que este e-mail é seu.`],
    cta: { label: "Confirmar meu e-mail", url: urlDoApp(`/confirmar-email/${token}`) },
    footnotes: ["O link vale por 24 horas e só pode ser usado uma vez.", "Se você não criou uma conta no Aceito, ignore este e-mail."],
  });
  const result = await enviarEmail({ to: user.username, subject: "Confirme seu e-mail no Aceito", html, text });
  return { sent: result.sent };
}

/** Confirma o e-mail pelo link. Devolve false se o link não existe, venceu ou já foi usado. */
export async function confirmarEmailPeloLink(token: unknown): Promise<boolean> {
  if (!tokenDeLinkTemFormatoValido(token)) return false;
  const registro = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: calcularHashDoTokenDeLink(token) }, select: { id: true, userId: true, usedAt: true, expiresAt: true } });
  if (!registro || registro.usedAt || registro.expiresAt <= new Date()) return false;

  const agora = new Date();
  return prisma.$transaction(async (tx) => {
    // Só uma vez: dois toques ao mesmo tempo não passam os dois
    const usado = await tx.emailVerificationToken.updateMany({ where: { id: registro.id, usedAt: null, expiresAt: { gt: agora } }, data: { usedAt: agora } });
    if (usado.count !== 1) return false;
    await tx.user.updateMany({ where: { id: registro.userId, emailVerifiedAt: null }, data: { emailVerifiedAt: agora } });
    return true;
  });
}
