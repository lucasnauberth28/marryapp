import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { parseSetting } from "@/lib/platform/settings-schema";
import { resolveSender } from "@/lib/platform/email-sender-core";

export const EMAIL_SENDER_TAG = "email-sender";

/**
 * Remetente configurado pela administração, com cache curto (30 s; a tag é limpa quando a administração salva).
 * Falha de leitura = nada configurado (vale o ambiente): nunca impede o envio.
 */
const readConfig = unstable_cache(
  async () => {
    try {
      const row = await prisma.platformSetting.findUnique({ where: { key: "emailSender" }, select: { value: true } });
      return parseSetting("emailSender", row?.value);
    } catch {
      return parseSetting("emailSender", null);
    }
  },
  ["platform-email-sender-v1"],
  { revalidate: 30, tags: [EMAIL_SENDER_TAG] },
);

export async function getEmailSender() {
  return resolveSender(await readConfig(), process.env.EMAIL_FROM);
}
