"use server";

// Minha conta: trocar a senha.
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { registrarAuditoria } from "@/lib/audit";
import { ERROS } from "@/lib/mensagens-de-erro";
import { type Falha, SEM_SESSAO, UM_MINUTO_EM_MS, contaAtual } from "@/actions/conta/comum";

const EsquemaDaTrocaDeSenha = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual.").max(200),
    newPassword: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres.").max(200, "Senha longa demais."),
    confirm: z.string().max(200),
  })
  .refine((v) => v.newPassword === v.confirm, { message: "As senhas novas não conferem.", path: ["confirm"] })
  .refine((v) => v.newPassword !== v.currentPassword, { message: "A nova senha precisa ser diferente da atual.", path: ["newPassword"] });

export async function trocarSenha(input: { currentPassword: string; newPassword: string; confirm: string }): Promise<{ success: true } | Falha> {
  const user = await contaAtual();
  if (!user) return SEM_SESSAO;

  const parsed = EsquemaDaTrocaDeSenha.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };

  const limit = await conferirLimiteDeUso({ key: `ACCOUNT_PASSWORD:${user.id}`, limit: 5, windowMs: 15 * UM_MINUTO_EM_MS });
  if (!limit.success) return { success: false, error: ERROS.muitasTentativas };

  if (!(await bcrypt.compare(parsed.data.currentPassword, user.password))) {
    return { success: false, error: "A senha atual não confere." };
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
    // Links de "esqueci a senha" pendentes deixam de valer.
    prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
  ]);
  await registrarAuditoria({ action: "account.password_change", targetType: "User", targetId: user.id });
  return { success: true };
}
