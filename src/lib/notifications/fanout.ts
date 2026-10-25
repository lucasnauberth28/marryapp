// Distribuição de um aviso já guardado para os canais extras (push, WhatsApp, e-mail).
// Puro: quem envia de verdade entra por `deps`, o que deixa a regra testável sem rede nem banco.

import { decidirCanais, type CanalDeNotificacao, type PreferenciasDeNotificacao } from "./preferences.ts";

export interface ItemDaDistribuicao {
  userId: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  dedupeKey: string;
}

export interface DependenciasDaDistribuicao {
  now: () => Date;
  /** Preferências de cada pessoa (quem nunca mexeu fica com o padrão). */
  loadPrefs: (userIds: string[]) => Promise<Map<string, PreferenciasDeNotificacao>>;
  /** Cada envio devolve true se entregou ao serviço do canal, false se não havia para onde enviar. */
  send: Record<CanalDeNotificacao, (item: ItemDaDistribuicao) => Promise<boolean>>;
  /** Padrão das preferências quando `loadPrefs` não devolve a pessoa. */
  defaults: PreferenciasDeNotificacao;
}

export interface RelatorioDaDistribuicao {
  sent: Record<CanalDeNotificacao, number>;
  failed: Record<CanalDeNotificacao, number>;
}

const relatorioVazioDaDistribuicao = (): Record<CanalDeNotificacao, number> => ({ push: 0, whatsapp: 0, email: 0 });

/**
 * Envia cada aviso pelos canais que as preferências e o tipo permitem. Um canal que falha
 * (rede, serviço fora do ar) nunca derruba os outros nem lança erro para quem chamou.
 */
export async function distribuir(items: ItemDaDistribuicao[], deps: DependenciasDaDistribuicao, only?: readonly CanalDeNotificacao[]): Promise<RelatorioDaDistribuicao> {
  const report: RelatorioDaDistribuicao = { sent: relatorioVazioDaDistribuicao(), failed: relatorioVazioDaDistribuicao() };
  if (items.length === 0) return report;

  let prefsByUser = new Map<string, PreferenciasDeNotificacao>();
  try {
    prefsByUser = await deps.loadPrefs([...new Set(items.map((i) => i.userId))]);
  } catch {
    // Sem as preferências, vale o padrão.
  }

  const now = deps.now();
  const jobs: Promise<void>[] = [];
  for (const item of items) {
    const prefs = prefsByUser.get(item.userId) ?? deps.defaults;
    for (const channel of decidirCanais({ type: item.type, prefs, now, only })) {
      jobs.push(
        (async () => {
          try {
            const delivered = await deps.send[channel](item);
            if (delivered) report.sent[channel]++;
          } catch {
            report.failed[channel]++;
          }
        })(),
      );
    }
  }
  await Promise.allSettled(jobs);
  return report;
}
