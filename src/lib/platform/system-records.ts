import "server-only";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * Registro do que acontece nos bastidores, para a Saúde do sistema (/admin/saude). Nunca lança erro:
 * uma falha ao registrar não pode derrubar o pagamento, o e-mail ou a rotina que está sendo medida.
 *
 *  - recordCronRun({ job, startedAt, status, summary?, error? })   uma linha por execução da rotina diária.
 *  - recordServiceEvent({ service, kind, ok, message?, refId? })    resultado de uma chamada externa
 *      (service: "mercadopago" | "email" | "whatsapp" | "push"). Guarde só o motivo curto da falha:
 *      NUNCA corpo de mensagem, e-mail, telefone, token ou chave.
 *  - prunePlatformRecords()   apaga eventos com mais de 30 dias e rotinas com mais de 90 (chamada pela rotina "avisos").
 *
 * Instrumentadas até agora: rotinas /api/cron/expirar-planos e /api/cron/avisos. Pendentes (agente da Saúde do
 * sistema): webhook do Mercado Pago, lib/email.ts, lib/evolution.ts (WhatsApp) e push.
 */

export async function registrarRodadaDaTarefaAgendada(run: {
  job: string;
  startedAt: Date;
  status: "OK" | "FAILED";
  summary?: Prisma.InputJsonValue;
  error?: string | null;
}): Promise<void> {
  try {
    await prisma.cronRun.create({
      data: {
        job: run.job.slice(0, 60),
        startedAt: run.startedAt,
        finishedAt: new Date(),
        status: run.status,
        summary: run.summary,
        error: run.error ? run.error.slice(0, 500) : null,
      },
    });
  } catch (error) {
    console.error("[recordCronRun]", error instanceof Error ? error.message : error);
  }
}

export async function registrarEventoDeServico(event: { service: string; kind: string; ok: boolean; message?: string | null; refId?: string | null }): Promise<void> {
  try {
    await prisma.serviceEvent.create({
      data: {
        service: event.service.slice(0, 40),
        kind: event.kind.slice(0, 40),
        ok: event.ok,
        message: event.message ? event.message.slice(0, 300) : null,
        refId: event.refId ? event.refId.slice(0, 100) : null,
      },
    });
  } catch (error) {
    console.error("[recordServiceEvent]", error instanceof Error ? error.message : error);
  }
}

export async function limparRegistrosAntigosDaPlataforma(now = new Date()): Promise<void> {
  const day = 24 * 60 * 60 * 1000;
  try {
    await Promise.all([
      prisma.serviceEvent.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 30 * day) } } }),
      prisma.cronRun.deleteMany({ where: { startedAt: { lt: new Date(now.getTime() - 90 * day) } } }),
    ]);
  } catch (error) {
    console.error("[prunePlatformRecords]", error instanceof Error ? error.message : error);
  }
}
