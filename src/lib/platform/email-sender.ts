import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { interpretarConfiguracao } from "@/lib/platform/settings-schema";
import { resolverRemetente } from "@/lib/platform/email-sender-core";

export const ETIQUETA_DO_REMETENTE_DE_EMAIL = "email-sender";

/**
 * Remetente configurado pela administração, com cache curto (30 s; a tag é limpa quando a administração salva).
 * Falha de leitura = nada configurado (vale o ambiente): nunca impede o envio.
 */
const lerConfiguracao = unstable_cache(
  async () => {
    try {
      const row = await prisma.platformSetting.findUnique({ where: { key: "emailSender" }, select: { value: true } });
      return interpretarConfiguracao("emailSender", row?.value);
    } catch {
      return interpretarConfiguracao("emailSender", null);
    }
  },
  ["platform-email-sender-v1"],
  { revalidate: 30, tags: [ETIQUETA_DO_REMETENTE_DE_EMAIL] },
);

export async function obterRemetenteDeEmail() {
  return resolverRemetente(await lerConfiguracao(), process.env.EMAIL_FROM);
}
