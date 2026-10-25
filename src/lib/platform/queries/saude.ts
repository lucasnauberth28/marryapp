import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";
import prisma from "@/lib/prisma";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { obterEstadoDaConexao, whatsappEstaConfigurado } from "@/lib/evolution";
import { emailEstaConfigurado } from "@/lib/email";
import { pushEstaConfigurado } from "@/lib/notifications/push";
import vercelConfig from "../../../../vercel.json";
import { itensDeAtencao, falhasSeguidas, situacaoDaTarefaAgendada, descreverResumoDaTarefaAgendada, tarefasDosAgendamentos, type ItemDeAtencao, type SituacaoDaTarefaAgendada } from "@/lib/platform/health";

/**
 * Saúde do sistema: só o que dá para medir. Banco (tempo e migrações), variáveis configuradas (sim/não, nunca o valor),
 * rotinas diárias (cron_runs) e resultado das chamadas a serviços (service_events, 24 h). Sem registro, o cartão diz
 * "sem registros" e nunca "tudo certo".
 */

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

export interface ContagensDosServicos {
  /** Eventos registrados nas últimas 24 h (0 = sem registros). */
  total: number;
  ok: number;
  failed: number;
}

interface EventoRecente {
  at: Date;
  ok: boolean;
  kind: string;
  message: string | null;
}

interface LinhaDeTarefaAgendada {
  job: string;
  state: SituacaoDaTarefaAgendada;
  lastAt: Date | null;
  result: string | null;
  error: string | null;
}

export interface FotoDaSaude {
  measuredAt: Date;
  mercadopago: { configured: boolean; webhookSecret: boolean; counts: ContagensDosServicos; recent: EventoRecente[]; consecutiveFailures: number };
  crons: LinhaDeTarefaAgendada[];
  whatsapp: { configured: boolean; connected: boolean | null; stateNote: string | null; counts: ContagensDosServicos; invalidNumbers: number };
  email: { configured: boolean; counts: ContagensDosServicos };
  push: { configured: boolean; subscriptions: number; counts: ContagensDosServicos };
  database: { ok: boolean; ms: number | null; migrationsApplied: number | null; migrationsPending: number | null };
  version: { sha: string | null; env: string | null };
  sentryConfigured: boolean;
  attention: ItemDeAtencao[];
}

function contagens(groups: { service: string; ok: boolean; _count: { _all: number } }[], service: string): ContagensDosServicos {
  const n = (ok: boolean) => groups.find((g) => g.service === service && g.ok === ok)?._count._all ?? 0;
  const ok = n(true);
  const failed = n(false);
  return { total: ok + failed, ok, failed };
}

async function comLimiteDeTempo<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}

async function saudeDoBanco(): Promise<FotoDaSaude["database"]> {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const ms = Date.now() - started;
    let applied: number | null = null;
    try {
      const rows = await prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*)::bigint AS n FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
      applied = Number(rows[0]?.n ?? 0);
    } catch {
      applied = null; // banco sem a tabela de histórico (adotado por script): não inventa número
    }
    let pending: number | null = null;
    if (applied !== null) {
      try {
        const dirs = (await readdir(path.join(process.cwd(), "prisma", "migrations"), { withFileTypes: true })).filter((d) => d.isDirectory()).length;
        pending = Math.max(0, dirs - applied);
      } catch {
        pending = null; // a pasta de migrações não vai junto do deploy: só dá para dizer quantas foram aplicadas
      }
    }
    return { ok: true, ms, migrationsApplied: applied, migrationsPending: pending };
  } catch {
    return { ok: false, ms: null, migrationsApplied: null, migrationsPending: null };
  }
}

/** Tela da administração: confere o acesso e mede. */
export async function obterFotoDaSaude(): Promise<FotoDaSaude> {
  await exigirAdminDaPlataforma();
  return coletarSaude();
}

/**
 * Mede a saúde SEM conferir o acesso: só para a rotina diária de alertas (que se autentica com o CRON_SECRET).
 * Telas e actions usam getHealthSnapshot.
 */
export async function coletarSaude(): Promise<FotoDaSaude> {
  const now = new Date();
  const since = new Date(now.getTime() - UM_DIA_EM_MS);
  const expected = tarefasDosAgendamentos((vercelConfig as { crons?: { path: string }[] }).crons);
  const whatsappConfigured = whatsappEstaConfigurado();

  const [groups, mpRecent, mpLast, runs, subscriptions, invalidNumbers, database, connection] = await Promise.all([
    prisma.serviceEvent.groupBy({ by: ["service", "ok"], where: { createdAt: { gte: since }, kind: { not: "invalid_number" } }, _count: { _all: true } }),
    prisma.serviceEvent.findMany({ where: { service: "mercadopago" }, orderBy: { createdAt: "desc" }, take: 6, select: { createdAt: true, ok: true, kind: true, message: true } }),
    prisma.serviceEvent.findMany({ where: { service: "mercadopago", kind: "webhook" }, orderBy: { createdAt: "desc" }, take: 5, select: { ok: true } }),
    prisma.cronRun.findMany({ where: { job: { in: expected } }, orderBy: { startedAt: "desc" }, distinct: ["job"], select: { job: true, status: true, startedAt: true, summary: true, error: true } }),
    prisma.pushSubscription.count(),
    prisma.serviceEvent.count({ where: { service: "whatsapp", kind: "invalid_number", createdAt: { gte: since } } }),
    saudeDoBanco(),
    whatsappConfigured ? comLimiteDeTempo(obterEstadoDaConexao(), 3000) : Promise.resolve(null),
  ]);

  const mp = contagens(groups, "mercadopago");
  const wa = contagens(groups, "whatsapp");
  const em = contagens(groups, "email");
  const pu = contagens(groups, "push");
  const connected = whatsappConfigured ? (connection ? connection.state === "open" : null) : null;

  const crons: LinhaDeTarefaAgendada[] = expected.map((job) => {
    const run = runs.find((r) => r.job === job) ?? null;
    return {
      job,
      state: situacaoDaTarefaAgendada(run, now),
      lastAt: run?.startedAt ?? null,
      result: run ? descreverResumoDaTarefaAgendada(job, run.summary) : null,
      error: run?.status === "FAILED" ? (run.error ?? "Falhou sem detalhe") : null,
    };
  });
  const mpFailures = falhasSeguidas(mpLast);

  return {
    measuredAt: now,
    mercadopago: {
      configured: Boolean((process.env.MERCADOPAGO_ACCESS_TOKEN ?? process.env.MP_ACCESS_TOKEN)?.trim()),
      webhookSecret: Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim()),
      counts: mp,
      recent: mpRecent.map((e) => ({ at: e.createdAt, ok: e.ok, kind: e.kind, message: e.message })),
      consecutiveFailures: mpFailures,
    },
    crons,
    whatsapp: {
      configured: whatsappConfigured,
      connected,
      stateNote: whatsappConfigured && connection === null ? "A Evolution API não respondeu a tempo." : null,
      counts: wa,
      invalidNumbers,
    },
    email: { configured: emailEstaConfigurado(), counts: em },
    push: { configured: pushEstaConfigurado(), subscriptions, counts: pu },
    database,
    version: { sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null, env: process.env.VERCEL_ENV ?? null },
    sentryConfigured: Boolean(process.env.SENTRY_DSN?.trim()),
    attention: itensDeAtencao({
      mercadopago: { failed24h: mp.failed, total24h: mp.total, consecutiveFailures: mpFailures },
      email: { failed24h: em.failed },
      whatsapp: { failed24h: wa.failed, configured: whatsappConfigured, connected },
      push: { failed24h: pu.failed },
      crons: crons.map((c) => ({ job: c.job, state: c.state })),
    }),
  };
}
