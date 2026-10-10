import "server-only";
import webpush from "web-push";
import prisma from "@/lib/prisma";
import { buildPushPayload, deliverPush, type PushDeliveryReport, type PushPayload, type PushSource } from "./push-payload.ts";

// Web Push sem serviço externo: VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY (npx web-push generate-vapid-keys)
// e VAPID_SUBJECT (mailto:). Sem as chaves, tudo aqui é desligado em silêncio.

const SEND_TIMEOUT_MS = 8_000;
const TTL_SECONDS = 60 * 60 * 24; // se o aparelho estiver desligado, o serviço guarda o aviso por 1 dia

export function vapidPublicKey(): string | null {
  const key = process.env.VAPID_PUBLIC_KEY?.trim();
  return key ? key : null;
}

export function isPushConfigured(): boolean {
  return Boolean(vapidPublicKey() && process.env.VAPID_PRIVATE_KEY?.trim());
}

let configured = false;
function configure() {
  if (configured) return;
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:contato@meuaceito.com.br";
  webpush.setVapidDetails(subject, vapidPublicKey()!, process.env.VAPID_PRIVATE_KEY!.trim());
  configured = true;
}

const EMPTY: PushDeliveryReport = { sent: 0, removed: 0, failed: 0 };

/** Envia o payload a todos os aparelhos da pessoa. Nunca lança erro. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushDeliveryReport & { devices: number }> {
  if (!isPushConfigured()) return { ...EMPTY, devices: 0 };
  try {
    configure();
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
      select: { endpoint: true, p256dh: true, auth: true },
    });
    const report = await deliverPush(subscriptions, payload, {
      send: async (sub, body) => {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body, {
          TTL: TTL_SECONDS,
          urgency: "normal",
          timeout: SEND_TIMEOUT_MS,
        });
      },
      remove: async (endpoint) => {
        await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
      },
      touch: async (endpoints) => {
        await prisma.pushSubscription.updateMany({ where: { endpoint: { in: endpoints }, userId }, data: { lastUsedAt: new Date() } });
      },
    });
    return { ...report, devices: subscriptions.length };
  } catch (error) {
    console.error("[push] Falha ao enviar:", error instanceof Error ? error.message : error);
    return { ...EMPTY, devices: 0 };
  }
}

/** Envia um aviso do catálogo (já guardado) aos aparelhos da pessoa. Devolve true se algum aparelho recebeu. */
export async function sendPushNotification(userId: string, source: PushSource): Promise<boolean> {
  const report = await sendPushToUser(userId, buildPushPayload(source));
  return report.sent > 0;
}
