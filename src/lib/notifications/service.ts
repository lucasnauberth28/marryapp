import "server-only";
import { after } from "next/server";
import prisma from "@/lib/prisma";
import type { TipoDeNotificacao } from "./catalog.ts";
import { montarTexto, type EventoDeNotificacao } from "./textos.ts";
import { distribuir, type ItemDaDistribuicao } from "./fanout.ts";
import type { CanalDeNotificacao } from "./preferences.ts";
import { dependenciasReaisDaDistribuicao } from "./senders.ts";

interface EntradaDoAviso {
  /** Quem recebe: exatamente um destes. `weddingId` e `vendorId` viram um aviso por usuário da conta. */
  userIds?: string[];
  weddingId?: string;
  vendorId?: string;
  type: TipoDeNotificacao;
  title: string;
  body: string;
  href: string | null;
  /** Um por fato (ex.: "gift_paid:<transação>"). Repetir o mesmo fato não cria outro aviso. */
  dedupeKey: string;
  /** Limita os canais extras (ex.: ["push"]). O aviso no sino sempre é guardado. */
  channels?: CanalDeNotificacao[];
}

interface ResultadoDoAviso {
  /** Avisos novos guardados (os repetidos, barrados pela chave, não contam). */
  created: number;
}

async function resolverDestinatarios(input: EntradaDoAviso): Promise<string[]> {
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
export function avisarDepois(task: () => Promise<unknown>) {
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
async function avisar(input: EntradaDoAviso): Promise<ResultadoDoAviso> {
  const userIds = await resolverDestinatarios(input);
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
  const items: ItemDaDistribuicao[] = created.map((row) => ({
    userId: row.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
    dedupeKey: input.dedupeKey,
  }));
  // Falha de canal nunca desfaz o aviso já guardado.
  await distribuir(items, dependenciasReaisDaDistribuicao(), input.channels).catch(() => undefined);
  return { created: created.length };
}

export type AlvoDoAviso = { userIds: string[] } | { weddingId: string } | { vendorId: string };

/**
 * Avisa a partir de um fato do catálogo, com o texto padrão. Nunca lança erro: um aviso que falha
 * não pode quebrar pagamento, webhook nem formulário. Só registra o motivo, sem dados pessoais.
 */
export async function avisarEvento(
  target: AlvoDoAviso,
  event: EventoDeNotificacao,
  dedupeKey: string,
  options: { channels?: CanalDeNotificacao[] } = {},
): Promise<void> {
  try {
    const copy = montarTexto(event);
    await avisar({ ...target, type: event.type, ...copy, dedupeKey, channels: options.channels });
  } catch (error) {
    console.error(`[avisos] Não foi possível guardar o aviso ${event.type}:`, error instanceof Error ? error.message : error);
  }
}
