// Regras puras da Saúde do sistema: estado das rotinas, falhas seguidas, texto dos resultados. Sem banco nem Next.
// Regra de honestidade: sem registro nunca vira "tudo certo"; o estado é "ainda não rodou" ou "sem registros".

export const CRON_LABEL: Record<string, string> = {
  "expirar-planos": "Vencimento de planos e avisos aos fornecedores",
  avisos: "Lembretes de despesas",
};

/** Uma rotina é considerada em dia se rodou com sucesso nas últimas 36 horas (roda uma vez por dia). */
export const CRON_FRESH_MS = 36 * 60 * 60 * 1000;

/** "/api/cron/avisos" -> "avisos". Ignora caminhos que não são de rotina. */
export function jobsFromCrons(crons: { path: string }[] | undefined): string[] {
  return (crons ?? []).map((c) => c.path.match(/^\/api\/cron\/([a-z0-9-]+)$/)?.[1]).filter((j): j is string => Boolean(j));
}

export type CronState = "never" | "ok" | "failed" | "late";

export function cronState(last: { status: "OK" | "FAILED"; startedAt: Date } | null, now: Date = new Date()): CronState {
  if (!last) return "never";
  if (last.status === "FAILED") return "failed";
  return now.getTime() - last.startedAt.getTime() > CRON_FRESH_MS ? "late" : "ok";
}

export const CRON_STATE_LABEL: Record<CronState, string> = {
  never: "Ainda não rodou",
  ok: "Rodou",
  failed: "Falhou",
  late: "Atrasada",
};

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/** Resultado de uma execução em palavras ("2 planos vencidos, 5 avisos"), lido do resumo gravado. Null se não souber ler. */
export function describeCronSummary(job: string, summary: unknown): string | null {
  const s = obj(summary);
  if (!s) return null;
  if (job === "expirar-planos") {
    const expired = num(s.expired);
    const sent = num(obj(s.reminders)?.sent);
    const parts: string[] = [];
    if (expired !== null) parts.push(`${expired} ${expired === 1 ? "plano vencido" : "planos vencidos"}`);
    if (sent !== null) parts.push(`${sent} ${sent === 1 ? "aviso" : "avisos"}`);
    return parts.length ? parts.join(", ") : null;
  }
  if (job === "avisos") {
    const checked = num(obj(s.expenses)?.checked);
    return checked === null ? null : `${checked} ${checked === 1 ? "despesa conferida" : "despesas conferidas"}`;
  }
  return null;
}

/** Quantos dos últimos eventos (mais recente primeiro) falharam em sequência, até o primeiro sucesso. */
export function consecutiveFailures(events: { ok: boolean }[]): number {
  let n = 0;
  for (const e of events) {
    if (e.ok) break;
    n++;
  }
  return n;
}

export interface AttentionItem {
  key: string;
  title: string;
  detail: string;
}

export interface AttentionInput {
  mercadopago: { failed24h: number; total24h: number; consecutiveFailures: number };
  email: { failed24h: number };
  whatsapp: { failed24h: number; configured: boolean; connected: boolean | null };
  push: { failed24h: number };
  crons: { job: string; state: CronState }[];
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** O que pede atenção agora, só com o que foi medido. Lista vazia não quer dizer "tudo certo" se nada foi medido. */
export function attentionItems(i: AttentionInput): AttentionItem[] {
  const items: AttentionItem[] = [];
  if (i.mercadopago.failed24h > 0) items.push({ key: "mercadopago", title: "Mercado Pago", detail: `${plural(i.mercadopago.failed24h, "aviso não foi aplicado", "avisos não foram aplicados")} nas últimas 24 horas.` });
  if (i.email.failed24h > 0) items.push({ key: "email", title: "E-mail", detail: `${plural(i.email.failed24h, "envio falhou", "envios falharam")} nas últimas 24 horas.` });
  if (i.whatsapp.configured && i.whatsapp.connected === false) items.push({ key: "whatsapp-off", title: "WhatsApp", detail: "A instância está desconectada: convites e lembretes não saem." });
  else if (i.whatsapp.failed24h > 0) items.push({ key: "whatsapp", title: "WhatsApp", detail: `${plural(i.whatsapp.failed24h, "mensagem não saiu", "mensagens não saíram")} nas últimas 24 horas.` });
  if (i.push.failed24h > 0) items.push({ key: "push", title: "Notificações no celular", detail: `${plural(i.push.failed24h, "envio falhou", "envios falharam")} nas últimas 24 horas.` });
  for (const c of i.crons) {
    if (c.state === "failed") items.push({ key: `cron-${c.job}`, title: CRON_LABEL[c.job] ?? c.job, detail: "A última execução da rotina falhou." });
    else if (c.state === "late") items.push({ key: `cron-${c.job}`, title: CRON_LABEL[c.job] ?? c.job, detail: "A rotina não roda há mais de 36 horas." });
  }
  return items;
}

export interface AlertSettings {
  mercadoPagoFailures: boolean;
  whatsappDisconnected: boolean;
  routineMissed: boolean;
}

/** Alertas por e-mail que valem agora, conforme o que a administração ligou. Rotina que nunca rodou não alerta. */
export function selectAlerts(
  settings: AlertSettings,
  s: { mpConsecutiveFailures: number; whatsapp: { configured: boolean; connected: boolean | null }; crons: { job: string; state: CronState }[] },
): AttentionItem[] {
  const out: AttentionItem[] = [];
  if (settings.mercadoPagoFailures && s.mpConsecutiveFailures >= 3) {
    out.push({ key: "mercadopago", title: "Mercado Pago falhou 3 vezes seguidas", detail: "Pode haver pagamento aprovado sem baixa no Aceito. Confira a Saúde do sistema." });
  }
  if (settings.whatsappDisconnected && s.whatsapp.configured && s.whatsapp.connected === false) {
    out.push({ key: "whatsapp", title: "WhatsApp desconectou", detail: "Convites e lembretes param de sair até reconectar a instância." });
  }
  if (settings.routineMissed) {
    for (const c of s.crons) {
      if (c.state === "late" || c.state === "failed") {
        out.push({ key: `cron-${c.job}`, title: `${CRON_LABEL[c.job] ?? c.job}: ${c.state === "failed" ? "a última execução falhou" : "a rotina não rodou"}`, detail: "Vencimentos e avisos podem atrasar." });
      }
    }
  }
  return out;
}

/** Os mesmos alertas já enviados hoje não se repetem: compara o conjunto de chaves. */
export function sameAlertSet(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");
}
