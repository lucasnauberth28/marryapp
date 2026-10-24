import "server-only";
import prisma from "@/lib/prisma";
import { generateLinkToken } from "@/lib/account/tokens";
import { brandedEmail, sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/app-url";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hora

/**
 * Cria o link de nova senha (só o hash vai ao banco, 1 h de validade, um por vez) e envia ao e-mail da conta.
 * Usado pelo "Esqueci a senha" público e pela administração. Nunca devolve o link nem o token: quem chama
 * só sabe se o e-mail foi aceito pelo provedor.
 */
export async function sendPasswordResetLink(user: { id: string; name: string; username: string }): Promise<{ sent: boolean }> {
  const { token, tokenHash } = generateLinkToken();
  await prisma.$transaction([
    // Um link por vez: pedir de novo invalida o anterior.
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
    }),
  ]);

  const firstName = user.name.trim().split(/\s+/)[0] || "";
  const { html, text } = brandedEmail({
    heading: "Crie uma nova senha",
    preheader: "O link vale por 1 hora.",
    paragraphs: [
      `${firstName ? `Olá, ${firstName}. ` : "Olá. "}Recebemos um pedido para trocar a senha da sua conta no Aceito.`,
      "Toque no botão abaixo para escolher uma senha nova.",
    ],
    cta: { label: "Criar nova senha", url: appUrl(`/redefinir-senha/${token}`) },
    footnotes: [
      "O link vale por 1 hora e só pode ser usado uma vez.",
      "Se não foi você, ignore este e-mail: sua senha continua a mesma.",
    ],
  });
  const result = await sendEmail({ to: user.username, subject: "Sua nova senha no Aceito", html, text });
  return { sent: result.sent };
}
