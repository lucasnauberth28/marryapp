"use server";

import { headers } from "next/headers";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getSession, SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { isAllowedPushEndpoint, buildPushPayload } from "@/lib/notifications/push-payload";
import { isPushConfigured, sendPushToUser } from "@/lib/notifications/push";

// Avisos no aparelho (Web Push). Tudo vale só para o usuário da sessão.

const MAX_DEVICES_PER_USER = 10;
const TEST_LIMIT = { limit: 5, windowMs: 1000 * 60 * 10 }; // 5 testes / 10 min por conta

const B64URL = /^[A-Za-z0-9_-]{10,200}$/;

const SubscriptionSchema = z.object({
  endpoint: z.string().refine(isAllowedPushEndpoint, "Aparelho não reconhecido."),
  keys: z.object({
    p256dh: z.string().regex(B64URL, "Chaves inválidas."),
    auth: z.string().regex(B64URL, "Chaves inválidas."),
  }),
});

export type PushActionResult = { success: true } | { success: false; error: string };

async function sessionUserId(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.userId === SUPER_ADMIN_USER_ID) return null;
  return session.userId;
}

/** Guarda (ou renova) o aparelho que acabou de ativar os avisos. */
export async function saveSubscription(input: unknown): Promise<PushActionResult> {
  const userId = await sessionUserId();
  if (!userId) return { success: false, error: "Entre na sua conta para ativar os avisos." };
  if (!isPushConfigured()) return { success: false, error: "Os avisos no aparelho ainda não estão disponíveis." };

  const parsed = SubscriptionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Aparelho não reconhecido." };
  const { endpoint, keys } = parsed.data;

  try {
    const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
    // Se o endereço já existia (mesmo navegador, outra conta), o aparelho passa a ser desta conta.
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent },
      update: { userId, p256dh: keys.p256dh, auth: keys.auth, userAgent, lastUsedAt: new Date() },
    });

    // Limite de aparelhos por conta: os mais antigos saem.
    const devices = await prisma.pushSubscription.findMany({
      where: { userId },
      orderBy: { lastUsedAt: "desc" },
      select: { id: true },
    });
    if (devices.length > MAX_DEVICES_PER_USER) {
      await prisma.pushSubscription.deleteMany({
        where: { userId, id: { in: devices.slice(MAX_DEVICES_PER_USER).map((d) => d.id) } },
      });
    }
    return { success: true };
  } catch (error) {
    console.error("[saveSubscription Error]:", error instanceof Error ? error.message : error);
    return { success: false, error: "Não conseguimos ativar os avisos agora. Tente de novo." };
  }
}

/** Remove o aparelho da própria conta (desativar avisos). Endereço de outra conta não é afetado. */
export async function removeSubscription(endpoint: unknown): Promise<PushActionResult> {
  const userId = await sessionUserId();
  if (!userId) return { success: false, error: "Entre na sua conta." };
  if (typeof endpoint !== "string" || endpoint.length > 2048) return { success: false, error: "Aparelho não reconhecido." };
  try {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
    return { success: true };
  } catch (error) {
    console.error("[removeSubscription Error]:", error instanceof Error ? error.message : error);
    return { success: false, error: "Não conseguimos desativar agora. Tente de novo." };
  }
}

/** Este endereço (do navegador de quem pergunta) está cadastrado nesta conta? Outra conta no mesmo aparelho diz que não. */
export async function isMySubscription(endpoint: unknown): Promise<boolean> {
  const userId = await sessionUserId();
  if (!userId || typeof endpoint !== "string" || endpoint.length > 2048) return false;
  try {
    return (await prisma.pushSubscription.count({ where: { endpoint, userId } })) > 0;
  } catch {
    return false;
  }
}

export type TestPushResult =
  | { success: true; devices: number }
  | { success: false; error: string };

/** Manda um aviso de teste a todos os aparelhos da própria conta. No máximo 5 a cada 10 minutos. */
export async function sendTestPush(): Promise<TestPushResult> {
  const userId = await sessionUserId();
  if (!userId) return { success: false, error: "Entre na sua conta." };
  if (!isPushConfigured()) return { success: false, error: "Os avisos no aparelho ainda não estão disponíveis." };

  const limit = await checkRateLimit({ key: `PUSH_TEST:${userId}`, ...TEST_LIMIT });
  if (!limit.success) {
    return { success: false, error: "Você já fez vários testes. Tente de novo daqui a alguns minutos." };
  }

  const report = await sendPushToUser(
    userId,
    buildPushPayload({
      title: "Aviso de teste",
      body: "Está funcionando! É assim que os avisos do Aceito vão chegar neste aparelho.",
      href: "/login", // abre o painel certo de quem tem sessão
      dedupeKey: "test-push",
    }),
  );
  if (report.devices === 0) return { success: false, error: "Nenhum aparelho ativo. Ative os avisos primeiro." };
  if (report.sent === 0) {
    return { success: false, error: "O aviso não chegou. Se o aparelho estiver desligado ou sem internet, tente de novo em instantes." };
  }
  return { success: true, devices: report.sent };
}
