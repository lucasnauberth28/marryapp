"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { after } from "next/server";
import prisma from "@/lib/prisma";
import { conferirLimiteDeUso, obterIpDoCliente } from "@/lib/security/rate-limiter";
import { calcularHashDoTokenDeLink, tokenDeLinkTemFormatoValido } from "@/lib/account/tokens";
import { enviarLinkDeRedefinicaoDeSenha } from "@/lib/account/password-reset-link";
import { registrarAuditoria } from "@/lib/audit";

import { ERROS } from "@/lib/mensagens-de-erro";
const UM_MINUTO_EM_MS = 60 * 1000;

/** Mesma resposta exista ou não a conta: não revela quais e-mails estão cadastrados. */
const MENSAGEM_NEUTRA =
  "Se houver uma conta com este e-mail, enviamos um link para criar uma nova senha. Ele vale por 1 hora. Confira também a caixa de spam.";

const EsquemaDoPedido = z.object({
  email: z.string().trim().toLowerCase().email("Confira o e-mail.").max(200),
});

export type ResultadoDoPedidoDeRedefinicao = { success: true; message: string } | { success: false; error: string };

/**
 * "Esqueci a senha": se o e-mail for de uma conta, cria um token (só o hash vai ao banco, 1 h de validade)
 * e envia o link /redefinir-senha/<token>. A busca e o envio rodam depois da resposta (after),
 * para que o tempo de resposta também não revele se a conta existe.
 */
export async function pedirRedefinicaoDeSenha(input: { email: string }): Promise<ResultadoDoPedidoDeRedefinicao> {
  const parsed = EsquemaDoPedido.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira o e-mail." };
  const { email } = parsed.data;

  const ip = await obterIpDoCliente();
  const byIp = await conferirLimiteDeUso({ key: `PWRESET_REQ_IP:${ip}`, limit: 5, windowMs: 15 * UM_MINUTO_EM_MS });
  if (!byIp.success) return { success: false, error: "Muitos pedidos seguidos. Aguarde alguns minutos e tente de novo." };

  // Por e-mail: no máximo 3 links por hora. Acima disso, responde igual e não envia nada.
  const byEmail = await conferirLimiteDeUso({ key: `PWRESET_REQ_EMAIL:${email}`, limit: 3, windowMs: 60 * UM_MINUTO_EM_MS });
  if (!byEmail.success) return { success: true, message: MENSAGEM_NEUTRA };

  after(async () => {
    try {
      const user = await prisma.user.findUnique({ where: { username: email }, select: { id: true, name: true } });
      if (!user) return;

      await enviarLinkDeRedefinicaoDeSenha({ id: user.id, name: user.name, username: email });
    } catch (error) {
      console.error("[requestPasswordReset] Falha ao preparar o link:", error instanceof Error ? error.message : error);
    }
  });

  return { success: true, message: MENSAGEM_NEUTRA };
}

const EsquemaDaRedefinicao = z
  .object({
    token: z.string().refine(tokenDeLinkTemFormatoValido, "Link inválido."),
    password: z.string().min(8, "Use pelo menos 8 caracteres.").max(200, "Senha longa demais."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "As senhas não conferem.", path: ["confirm"] });

export type ResultadoDaRedefinicaoDeSenha = { success: true } | { success: false; error: string; expired?: boolean };

const MENSAGEM_DE_EXPIRADO = "Este link expirou ou já foi usado. Peça um novo para criar a senha.";

/** Troca a senha pelo link do e-mail e invalida este e todos os outros links da conta. */
export async function redefinirSenha(input: { token: string; password: string; confirm: string }): Promise<ResultadoDaRedefinicaoDeSenha> {
  const parsed = EsquemaDaRedefinicao.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { success: false, error: issue?.message ?? "Confira os dados.", expired: issue?.path[0] === "token" };
  }
  const { token, password } = parsed.data;

  const ip = await obterIpDoCliente();
  const byIp = await conferirLimiteDeUso({ key: `PWRESET_USE_IP:${ip}`, limit: 10, windowMs: 15 * UM_MINUTO_EM_MS });
  if (!byIp.success) return { success: false, error: ERROS.muitasTentativas };

  const tokenHash = calcularHashDoTokenDeLink(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, usedAt: true, expiresAt: true, user: { select: { name: true, username: true } } },
  });
  if (!record || record.usedAt || record.expiresAt <= new Date()) return { success: false, error: MENSAGEM_DE_EXPIRADO, expired: true };

  const byAccount = await conferirLimiteDeUso({ key: `PWRESET_USE_ACCOUNT:${record.userId}`, limit: 5, windowMs: 15 * UM_MINUTO_EM_MS });
  if (!byAccount.success) return { success: false, error: ERROS.muitasTentativas };

  const hashed = await bcrypt.hash(password, 12);
  const now = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      // Marca o uso só se ninguém usou no meio do caminho (dois envios ao mesmo tempo).
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) throw new Error("TOKEN_USED");
      await tx.user.update({ where: { id: record.userId }, data: { password: hashed } });
      await tx.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: now } });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "TOKEN_USED") return { success: false, error: MENSAGEM_DE_EXPIRADO, expired: true };
    console.error("[resetPassword]", error);
    return { success: false, error: "Não conseguimos trocar a senha agora. Tente de novo em instantes." };
  }

  await registrarAuditoria({
    action: "account.password_reset",
    targetType: "User",
    targetId: record.userId,
    actor: { id: record.userId, name: record.user.name },
  });

  return { success: true };
}
