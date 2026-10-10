import "server-only";
import { after } from "next/server";
import prisma from "@/lib/prisma";
import { buildCopy, type NotificationEvent, type NotificationType } from "./catalog.ts";
import { fanOut, type FanOutItem } from "./fanout.ts";
import type { NotificationChannel } from "./preferences.ts";
import { realFanOutDeps } from "./senders.ts";

export interface NotifyInput {
  /** Quem recebe: exatamente um destes. `weddingId` e `vendorId` viram um aviso por usuário da conta. */
  userIds?: string[];
  weddingId?: string;
  vendorId?: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  /** Um por fato (ex.: "gift_paid:<transação>"). Repetir o mesmo fato não cria outro aviso. */
  dedupeKey: string;
  /** Limita os canais extras (ex.: ["push"]). O aviso no sino sempre é guardado. */
  channels?: NotificationChannel[];
}

export interface NotifyResult {
  /** Avisos novos guardados (os repetidos, barrados pela chave, não contam). */
  created: number;
}

async function resolveRecipients(input: NotifyInput): Promise<string[]> {
  if (input.userIds) return [...new Set(input.userIds)];
  if (input.weddingId) {
    const users = await prisma.user.findMany({ where: { weddingId: input.weddingId }, select: { id: true } });
    return users.map((u) => u.id);
  }
  if (input.vendorId) {
    const users = await prisma.user.findMany({ where: { partnerVendorId: input.vendorId }, select: { id: true } });
    return users.map((u) => u.id);
  }
  return [];
}

/**
 * Roda o aviso depois de a resposta ir ao usuário (`after`), para pagamento, webhook e formulário
 * não esperarem o banco nem os serviços de push. Fora de uma requisição (script, teste) roda na hora.
 */
export function deferNotify(task: () => Promise<unknown>) {
  const safe = async () => {
    try {
      await task();
    } catch (error) {
      console.error("[avisos] Falha ao avisar:", error instanceof Error ? error.message : error);
    }
  };
  try {
    after(safe);
  } catch {
    void safe();
  }
}

/**
 * Guarda o aviso de forma idempotente para cada pessoa e distribui pelos canais extras (esperando os envios).
 * Pode lançar erro de banco: nos fluxos reais use `notifyEvent`, que nunca lança, dentro de `deferNotify`
 * quando houver uma pessoa esperando a resposta.
 */
export async function notify(input: NotifyInput): Promise<NotifyResult> {
  const userIds = await resolveRecipients(input);
  if (userIds.length === 0) return { created: 0 };

  const created = await prisma.notification.createManyAndReturn({
    data: userIds.map((userId) => ({
      userId,
      type: input.type,
      title: input.title.slice(0, 200),
      body: input.body.slice(0, 1000),
      href: input.href,
      weddingId: input.weddingId ?? null,
      vendorId: input.vendorId ?? null,
      dedupeKey: input.dedupeKey.slice(0, 200),
    })),
    skipDuplicates: true,
    select: { userId: true },
  });
  if (created.length === 0) return { created: 0 };

  // Só quem acabou de receber o aviso entra na distribuição: webhook repetido não repete push.
  const items: FanOutItem[] = created.map((row) => ({
    userId: row.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
    dedupeKey: input.dedupeKey,
  }));
  // Falha de canal nunca desfaz o aviso já guardado.
  await fanOut(items, realFanOutDeps(), input.channels).catch(() => undefined);
  return { created: created.length };
}

export type NotifyTarget = { userIds: string[] } | { weddingId: string } | { vendorId: string };

/**
 * Avisa a partir de um fato do catálogo, com o texto padrão. Nunca lança erro: um aviso que falha
 * não pode quebrar pagamento, webhook nem formulário. Só registra o motivo, sem dados pessoais.
 */
export async function notifyEvent(
  target: NotifyTarget,
  event: NotificationEvent,
  dedupeKey: string,
  options: { channels?: NotificationChannel[] } = {},
): Promise<void> {
  try {
    const copy = buildCopy(event);
    await notify({ ...target, type: event.type, ...copy, dedupeKey, channels: options.channels });
  } catch (error) {
    console.error(`[avisos] Não foi possível guardar o aviso ${event.type}:`, error instanceof Error ? error.message : error);
  }
}
