import "server-only";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { prefixosDoGrupo } from "@/lib/platform/activity";

/** Registro de atividades (AuditLog) com filtro por tipo, período, pessoa e alvo. Só leitura; os detalhes são resumidos na tela. */

export const PERIODOS = ["7d", "30d", "90d"] as const;
type Periodo = (typeof PERIODOS)[number];
const UM_DIA_EM_MS = 86_400_000;

export interface FiltrosDeAtividade {
  group?: string;
  period?: Periodo;
  q?: string;
  target?: { type: string; id: string } | null;
}

export interface LinhaDeAtividade {
  id: string;
  createdAt: Date;
  actorName: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: unknown;
}

function filtroDeAtividade(f: FiltrosDeAtividade, now = new Date()): Prisma.AuditLogWhereInput {
  const and: Prisma.AuditLogWhereInput[] = [];
  const prefixes = prefixosDoGrupo(f.group);
  if (prefixes.length) and.push({ OR: prefixes.map((p) => ({ action: { startsWith: p } })) });
  if (f.period) and.push({ createdAt: { gte: new Date(now.getTime() - Number.parseInt(f.period, 10) * UM_DIA_EM_MS) } });
  if (f.q) and.push({ OR: [{ actorName: { contains: f.q, mode: "insensitive" } }, { targetId: f.q }] });
  if (f.target) and.push({ targetType: { equals: f.target.type, mode: "insensitive" }, targetId: f.target.id });
  return and.length ? { AND: and } : {};
}

export async function listarAtividades(filters: FiltrosDeAtividade, skip: number, take: number): Promise<{ rows: LinhaDeAtividade[]; total: number }> {
  await exigirAdminDaPlataforma();
  const where = filtroDeAtividade(filters);
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, select: { id: true, createdAt: true, actorName: true, action: true, targetType: true, targetId: true, details: true } }),
    prisma.auditLog.count({ where }),
  ]);
  return { rows, total };
}

/** Nome do casamento do filtro "?alvo=wedding:<id>", para o cabeçalho do filtro (null se não achar). */
export async function legendaDoAlvo(target: { type: string; id: string } | null): Promise<string | null> {
  await exigirAdminDaPlataforma();
  if (!target) return null;
  const type = target.type.toLowerCase();
  if (type === "wedding" && /^[0-9a-f-]{36}$/i.test(target.id)) {
    return (await prisma.wedding.findUnique({ where: { id: target.id }, select: { coupleNames: true } }))?.coupleNames ?? null;
  }
  if (type === "partner_vendor" && /^[0-9a-f-]{36}$/i.test(target.id)) {
    return (await prisma.partnerVendor.findUnique({ where: { id: target.id }, select: { companyName: true } }))?.companyName ?? null;
  }
  return null;
}
