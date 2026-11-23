import "server-only";
import prisma from "@/lib/prisma";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { inicioDoMesEmBrasilia } from "@/lib/liz/uso-servidor";

/** Consumo do mês corrente em toda a Liz: perguntas, casais distintos, recusas por fuga de assunto e custo estimado. */
export async function obterUsoDoMesDaLiz(): Promise<{ perguntas: number; casais: number; foraDoAssunto: number; custoEmReais: number }> {
  await exigirAdminDaPlataforma();
  const desde = inicioDoMesEmBrasilia(new Date());
  const [total, foraDoAssunto, soma, casais] = await Promise.all([
    prisma.madrinhaUso.count({ where: { createdAt: { gte: desde } } }),
    prisma.madrinhaUso.count({ where: { createdAt: { gte: desde }, foraDoAssunto: true } }),
    prisma.madrinhaUso.aggregate({ where: { createdAt: { gte: desde } }, _sum: { custoEmMicroReais: true } }),
    prisma.madrinhaUso.groupBy({ by: ["weddingId"], where: { createdAt: { gte: desde } } }),
  ]);
  return { perguntas: total, casais: casais.length, foraDoAssunto, custoEmReais: (soma._sum.custoEmMicroReais ?? 0) / 1_000_000 };
}
