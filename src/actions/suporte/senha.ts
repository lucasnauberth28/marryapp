"use server";

// Suporte (administração): esqueci a senha, para ajudar quem não recebeu o e-mail.
import { z } from "zod";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { enviarLinkDeRedefinicaoDeSenha } from "@/lib/account/password-reset-link";
import { esconderEmailParaORegistro } from "@/lib/platform/support";
import { type Falha, type Sucesso, UM_MINUTO_EM_MS, falhaDeValidacao } from "@/actions/suporte/comum";

const MENSAGEM_NEUTRA = "Se existir uma conta com este e-mail, enviamos o link de redefinição. Ele vale por 1 hora.";

/** Resposta sempre neutra (não revela se a conta existe). O link NUNCA aparece na tela nem no registro. */
export async function enviarRedefinicaoDeSenhaPeloSuporte(input: unknown): Promise<Sucesso | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const parsed = z.object({ email: z.string().trim().toLowerCase().email("Confira o e-mail.").max(200) }).safeParse(input);
    if (!parsed.success) return falhaDeValidacao(parsed.error);
    const limit = await conferirLimiteDeUso({ key: `ADMIN_PWRESET:${admin.userId}`, limit: 10, windowMs: 60 * UM_MINUTO_EM_MS });
    if (!limit.success) return { success: false, error: "Muitos envios seguidos. Aguarde um pouco." };
    const byEmail = await conferirLimiteDeUso({ key: `PWRESET_REQ_EMAIL:${parsed.data.email}`, limit: 3, windowMs: 60 * UM_MINUTO_EM_MS });
    const user = byEmail.success ? await prisma.user.findUnique({ where: { username: parsed.data.email }, select: { id: true, name: true, username: true } }) : null;
    const result = user ? await enviarLinkDeRedefinicaoDeSenha(user) : null;
    await registrarAuditoria({
      action: "support.password_reset",
      targetType: "user",
      targetId: user?.id,
      details: { email: esconderEmailParaORegistro(parsed.data.email), accountFound: Boolean(user), emailAccepted: result?.sent ?? false, limited: !byEmail.success },
    });
    return { success: true, message: MENSAGEM_NEUTRA };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "sendSupportPasswordReset");
  }
}
