import "server-only";
import prisma from "@/lib/prisma";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { normalizeSearch, phoneDigits } from "@/lib/platform/support";

/**
 * Consultas de Suporte e LGPD. Atravessam casamentos de propósito (é o dono), mas o select nunca inclui
 * senha, tokens, chaves nem documento (CPF/CNPJ) de ninguém.
 */

interface SearchHit {
  kind: "wedding" | "user" | "vendor";
  id: string;
  title: string;
  detail: string;
  /** Para onde o resultado leva (null = sem tela para abrir, ex.: conta da equipe). */
  href: string | null;
  /** Para "Abrir um pedido de ajuda" a partir do resultado. */
  ticketHref: string | null;
}

export interface SearchResults {
  query: string;
  hits: SearchHit[];
}

const PER_TYPE = 8;

/** Busca em tudo: casal (nome, endereço do site, domínio), pessoa (nome, e-mail) e fornecedor (nome, telefone). Até 8 por tipo. */
export async function searchEverything(raw: string | undefined): Promise<SearchResults | null> {
  await exigirAdminDaPlataforma();
  const q = normalizeSearch(raw);
  if (!q) return null;
  const digits = phoneDigits(q);
  const ci = { contains: q, mode: "insensitive" as const };

  const [weddings, users, vendors] = await Promise.all([
    prisma.wedding.findMany({
      where: { OR: [{ coupleNames: ci }, { slug: ci }, { customDomain: ci }] },
      orderBy: { createdAt: "desc" },
      take: PER_TYPE,
      select: { id: true, coupleNames: true, slug: true, customDomain: true, suspendedAt: true },
    }),
    prisma.user.findMany({
      where: { OR: [{ name: ci }, { username: ci }] },
      orderBy: { createdAt: "desc" },
      take: PER_TYPE,
      select: { id: true, name: true, username: true, weddingId: true, partnerVendorId: true, role: { select: { allowedPaths: true } } },
    }),
    prisma.partnerVendor.findMany({
      where: {
        OR: [
          { companyName: ci },
          ...(digits ? [{ phone: { contains: digits } }, { whatsapp: { contains: digits } }] : []),
          { phone: ci },
          { whatsapp: ci },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: PER_TYPE,
      select: { id: true, companyName: true, category: true, suspendedAt: true },
    }),
  ]);

  const hits: SearchHit[] = [
    ...weddings.map((w) => ({
      kind: "wedding" as const,
      id: w.id,
      title: w.coupleNames,
      detail: `Casal · ${w.customDomain ?? w.slug}${w.suspendedAt ? " · suspenso" : ""}`,
      href: `/admin/casais/${w.id}`,
      ticketHref: `/admin/suporte?novo=1&casal=${w.id}#chamados`,
    })),
    ...users.map((u) => {
      const isStaff = Array.isArray(u.role.allowedPaths) && (u.role.allowedPaths as string[]).includes("*");
      return {
        kind: "user" as const,
        id: u.id,
        title: u.name,
        detail: `${u.partnerVendorId ? "Conta de fornecedor" : u.weddingId ? "Conta de casal" : isStaff ? "Equipe" : "Conta"} · ${u.username}`,
        href: u.weddingId ? `/admin/casais/${u.weddingId}` : u.partnerVendorId ? `/admin/fornecedores?id=${u.partnerVendorId}` : null,
        ticketHref: u.weddingId ? `/admin/suporte?novo=1&casal=${u.weddingId}#chamados` : u.partnerVendorId ? `/admin/suporte?novo=1&fornecedor=${u.partnerVendorId}#chamados` : null,
      };
    }),
    ...vendors.map((v) => ({
      kind: "vendor" as const,
      id: v.id,
      title: v.companyName,
      detail: `Fornecedor · ${v.category}${v.suspendedAt ? " · suspenso" : ""}`,
      href: `/admin/fornecedores?id=${v.id}`,
      ticketHref: `/admin/suporte?novo=1&fornecedor=${v.id}#chamados`,
    })),
  ];
  return { query: q, hits };
}

export interface TicketRow {
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

export async function listTickets(opts: { showClosed: boolean }): Promise<{ rows: TicketRow[]; newCount: number; closedCount: number }> {
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
export async function ticketPrefill(ref: { weddingId?: string; vendorId?: string }): Promise<{ weddingId?: string; vendorId?: string; requesterName: string; requesterEmail: string; label: string } | null> {
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

export interface DataRequestRow {
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

export async function listDataRequests(): Promise<DataRequestRow[]> {
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

export interface IncidentRow {
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

export async function listIncidents(): Promise<IncidentRow[]> {
  await exigirAdminDaPlataforma();
  return prisma.securityIncident.findMany({
    orderBy: [{ status: "asc" }, { discoveredAt: "desc" }],
    take: 30,
    select: { id: true, title: true, description: true, affected: true, discoveredAt: true, notifiedAt: true, notifiedWho: true, status: true, closedAt: true },
  });
}
