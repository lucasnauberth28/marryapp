// Consultas de suporte da administração: chamados, solicitações de dados pessoais (LGPD) e incidentes.
import "server-only";
import prisma from "@/lib/prisma";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";

export interface LinhaDeChamado {
  id: string;
  number: number;
  subject: string;
  body: string | null;
  requesterName: string;
  requesterEmail: string | null;
  status: "NEW" | "IN_PROGRESS" | "ANSWERED" | "CLOSED";
  assigneeId: string | null;
  assigneeName: string | null;
  internalNote: string | null;
  weddingId: string | null;
  vendorId: string | null;
  createdAt: Date;
}

export async function listarChamados(opts: { showClosed: boolean }): Promise<{ rows: LinhaDeChamado[]; newCount: number; closedCount: number }> {
  await exigirAdminDaPlataforma();
  const [rows, newCount, closedCount] = await Promise.all([
    prisma.supportTicket.findMany({
      where: opts.showClosed ? undefined : { status: { not: "CLOSED" } },
      orderBy: [{ createdAt: "desc" }],
      take: 40,
      select: {
        id: true, number: true, subject: true, body: true, requesterName: true, requesterEmail: true, status: true,
        assigneeId: true, assigneeName: true, internalNote: true, weddingId: true, vendorId: true, createdAt: true,
      },
    }),
    prisma.supportTicket.count({ where: { status: "NEW" } }),
    prisma.supportTicket.count({ where: { status: "CLOSED" } }),
  ]);
  return { rows, newCount, closedCount };
}

/** Dados para preencher "Novo pedido" quando vem de um casal ou fornecedor (links de Casais e da busca). */
export async function preenchimentoDoChamado(ref: { weddingId?: string; vendorId?: string }): Promise<{ weddingId?: string; vendorId?: string; requesterName: string; requesterEmail: string; label: string } | null> {
  await exigirAdminDaPlataforma();
  if (ref.weddingId) {
    const w = await prisma.wedding.findUnique({ where: { id: ref.weddingId }, select: { id: true, coupleNames: true, members: { orderBy: { createdAt: "asc" }, take: 1, select: { name: true, username: true } } } });
    if (!w) return null;
    const owner = w.members[0];
    return { weddingId: w.id, requesterName: owner?.name ?? w.coupleNames, requesterEmail: owner?.username.includes("@") ? owner.username : "", label: `casal ${w.coupleNames}` };
  }
  if (ref.vendorId) {
    const v = await prisma.partnerVendor.findUnique({ where: { id: ref.vendorId }, select: { id: true, companyName: true, user: { select: { name: true, username: true } } } });
    if (!v) return null;
    const owner = v.user;
    return { vendorId: v.id, requesterName: owner?.name ?? v.companyName, requesterEmail: owner?.username.includes("@") ? owner.username : "", label: `fornecedor ${v.companyName}` };
  }
  return null;
}

export interface LinhaDeSolicitacaoDeDados {
  id: string;
  type: "EXPORT" | "DELETE" | "CORRECTION" | "OTHER";
  requesterName: string;
  requesterEmail: string;
  userId: string | null;
  status: "NEW" | "IN_REVIEW" | "DONE" | "REFUSED";
  receivedAt: Date;
  dueAt: Date;
  completedAt: Date | null;
  note: string | null;
  handledByName: string | null;
}

export async function listarSolicitacoesDeDados(): Promise<LinhaDeSolicitacaoDeDados[]> {
  await exigirAdminDaPlataforma();
  // Abertos primeiro (o mais perto de vencer no topo), depois os encerrados mais recentes
  const [open, closed] = await Promise.all([
    prisma.dataRequest.findMany({ where: { status: { in: ["NEW", "IN_REVIEW"] } }, orderBy: { dueAt: "asc" }, take: 50 }),
    prisma.dataRequest.findMany({ where: { status: { in: ["DONE", "REFUSED"] } }, orderBy: { completedAt: "desc" }, take: 10 }),
  ]);
  return [...open, ...closed].map((r) => ({
    id: r.id, type: r.type, requesterName: r.requesterName, requesterEmail: r.requesterEmail, userId: r.userId, status: r.status,
    receivedAt: r.receivedAt, dueAt: r.dueAt, completedAt: r.completedAt, note: r.note, handledByName: r.handledByName,
  }));
}

export interface LinhaDeIncidente {
  id: string;
  title: string;
  description: string;
  affected: string | null;
  discoveredAt: Date;
  notifiedAt: Date | null;
  notifiedWho: string | null;
  status: "OPEN" | "CLOSED";
  closedAt: Date | null;
}

export async function listarIncidentes(): Promise<LinhaDeIncidente[]> {
  await exigirAdminDaPlataforma();
  return prisma.securityIncident.findMany({
    orderBy: [{ status: "asc" }, { discoveredAt: "desc" }],
    take: 30,
    select: { id: true, title: true, description: true, affected: true, discoveredAt: true, notifiedAt: true, notifiedWho: true, status: true, closedAt: true },
  });
}
