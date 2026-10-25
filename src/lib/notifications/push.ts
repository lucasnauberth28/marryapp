import "server-only";
import webpush from "web-push";
import prisma from "@/lib/prisma";
import { recordServiceEvent } from "@/lib/platform/system-records";
import { montarConteudoDoPush, entregarPush, type RelatorioDaEntregaDePush, type ConteudoDoPush, type OrigemDoPush } from "./push-payload.ts";

// Web Push sem serviço externo: VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY (npx web-push generate-vapid-keys)
// e VAPID_SUBJECT (mailto:). Sem as chaves, tudo aqui é desligado em silêncio.

const LIMITE_DE_TEMPO_DO_ENVIO_EM_MS = 8_000;
const VALIDADE_EM_SEGUNDOS = 60 * 60 * 24; // se o aparelho estiver desligado, o serviço guarda o aviso por 1 dia

export function chavePublicaVapid(): string | null {
  const key = process.env.VAPID_PUBLIC_KEY?.trim();
  return key ? key : null;
}

export function pushEstaConfigurado(): boolean {
  return Boolean(chavePublicaVapid() && process.env.VAPID_PRIVATE_KEY?.trim());
}

let pushConfigurado = false;
function configurarPush() {
  if (pushConfigurado) return;
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:contato@meuaceito.com.br";
  webpush.setVapidDetails(subject, chavePublicaVapid()!, process.env.VAPID_PRIVATE_KEY!.trim());
  pushConfigurado = true;
}

const RESULTADO_VAZIO: RelatorioDaEntregaDePush = { sent: 0, removed: 0, failed: 0 };

/** Envia o payload a todos os aparelhos da pessoa. Nunca lança erro. */
export async function enviarPushParaAPessoa(userId: string, payload: ConteudoDoPush): Promise<RelatorioDaEntregaDePush & { devices: number }> {
  if (!pushEstaConfigurado()) return { ...RESULTADO_VAZIO, devices: 0 };
  try {
    configurarPush();
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
      select: { endpoint: true, p256dh: true, auth: true },
    });
    const report = await entregarPush(subscriptions, payload, {
      send: async (sub, body) => {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body, {
          TTL: VALIDADE_EM_SEGUNDOS,
          urgency: "normal",
          timeout: LIMITE_DE_TEMPO_DO_ENVIO_EM_MS,
        });
      },
      remove: async (endpoint) => {
        await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
      },
      touch: async (endpoints) => {
        await prisma.pushSubscription.updateMany({ where: { endpoint: { in: endpoints }, userId }, data: { lastUsedAt: new Date() } });
      },
    });
    // Saúde do sistema: uma linha por pessoa com aparelho (sem endereço do aparelho nem texto do aviso)
    if (subscriptions.length > 0) {
      await recordServiceEvent({
        service: "push",
        kind: "send",
        ok: report.failed === 0,
        message: report.failed === 0 ? null : `${report.failed} de ${subscriptions.length} aparelhos falharam`,
      });
    }
    return { ...report, devices: subscriptions.length };
  } catch (error) {
    console.error("[push] Falha ao enviar:", error instanceof Error ? error.message : error);
    await recordServiceEvent({ service: "push", kind: "send", ok: false, message: "Erro ao enviar" });
    return { ...RESULTADO_VAZIO, devices: 0 };
  }
}

/** Envia um aviso do catálogo (já guardado) aos aparelhos da pessoa. Devolve true se algum aparelho recebeu. */
export async function enviarNotificacaoPush(userId: string, source: OrigemDoPush): Promise<boolean> {
  const report = await enviarPushParaAPessoa(userId, montarConteudoDoPush(source));
  return report.sent > 0;
}
