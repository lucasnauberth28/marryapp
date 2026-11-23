import "server-only";
import prisma from "@/lib/prisma";
import type { EntradaDosLimites } from "./limites-de-uso";

const HORA = 3_600_000;
const BRASILIA_EM_HORAS = 3;

/** Primeiro instante do mês corrente no horário de Brasília (UTC-3, sem horário de verão). */
export function inicioDoMesEmBrasilia(agora: Date): Date {
  const local = new Date(agora.getTime() - BRASILIA_EM_HORAS * HORA);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1, BRASILIA_EM_HORAS));
}

/** Primeiro instante do dia corrente no horário de Brasília. */
export function inicioDoDiaEmBrasilia(agora: Date): Date {
  const local = new Date(agora.getTime() - BRASILIA_EM_HORAS * HORA);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), BRASILIA_EM_HORAS));
}

/** O consumo que as regras de limite precisam, lido do banco para o casamento da sessão. */
export async function lerUsoDaLiz(weddingId: string, horasDeBloqueio: number, agora = new Date()): Promise<EntradaDosLimites["uso"]> {
  const doMes = inicioDoMesEmBrasilia(agora);
  const [naUltimaHora, hoje, noMes, foraDoAssunto, custoDoCasal, custoGlobal] = await Promise.all([
    prisma.madrinhaUso.count({ where: { weddingId, createdAt: { gte: new Date(agora.getTime() - HORA) } } }),
    prisma.madrinhaUso.count({ where: { weddingId, createdAt: { gte: inicioDoDiaEmBrasilia(agora) } } }),
    prisma.madrinhaUso.count({ where: { weddingId, createdAt: { gte: doMes } } }),
    prisma.madrinhaUso.count({ where: { weddingId, foraDoAssunto: true, createdAt: { gte: new Date(agora.getTime() - horasDeBloqueio * HORA) } } }),
    prisma.madrinhaUso.aggregate({ where: { weddingId, createdAt: { gte: doMes } }, _sum: { custoEmMicroReais: true } }),
    prisma.madrinhaUso.aggregate({ where: { createdAt: { gte: doMes } }, _sum: { custoEmMicroReais: true } }),
  ]);
  return {
    naUltimaHora,
    hoje,
    noMes,
    foraDoAssuntoNoPeriodoDeBloqueio: foraDoAssunto,
    custoDoCasalNoMesEmMicroReais: custoDoCasal._sum.custoEmMicroReais ?? 0,
    custoGlobalNoMesEmMicroReais: custoGlobal._sum.custoEmMicroReais ?? 0,
  };
}

/** Anota uma pergunta respondida: só o consumo, nunca o texto. */
export async function registrarUsoDaLiz(dados: { weddingId: string; inputTokens: number; outputTokens: number; custoEmMicroReais: number; foraDoAssunto: boolean }): Promise<void> {
  await prisma.madrinhaUso.create({ data: dados });
}
