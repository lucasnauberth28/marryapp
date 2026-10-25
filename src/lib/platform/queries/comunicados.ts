import "server-only";
import prisma from "@/lib/prisma";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { MAXIMO_DE_DESTINATARIOS } from "@/lib/platform/announcement";
import { chavesDePlanoDoCasal, interpretarPublico, chavesDeNivelDoFornecedor, intervaloDaJanelaDeCasamento, type Publico } from "@/lib/platform/announcement-audience";

/**
 * Público dos comunicados, sempre resolvido no servidor a partir do filtro (nunca de uma lista vinda do navegador).
 * Plano do casal = última assinatura de casal APROVADA (mesma regra de lib/wedding-plan); sem assinatura = Básico.
 * Plano do fornecedor = planTier, valendo FREE depois de planExpiresAt.
 */

export interface PessoaDestinataria {
  id: string;
  username: string;
  name: string;
  kind: "couple" | "vendor";
}

export interface PrevisaoDoPublico {
  couples: { matched: number; total: number };
  vendors: { matched: number; total: number };
  people: number;
  tooMany: boolean;
}

const LIMITE_DE_CASAIS = 50_000;

/** Plano vigente de cada casamento que tem assinatura de casal aprovada (mais recente primeiro). */
async function planoDoCasalPorCasamento(): Promise<Map<string, string>> {
  const subs = await prisma.subscription.findMany({
    where: { planType: "COUPLE", status: "APPROVED", OR: [{ weddingId: { not: null } }, { weddingId: null, user: { weddingId: { not: null } } }] },
    orderBy: [{ paidAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: { weddingId: true, planId: true, user: { select: { weddingId: true } } },
  });
  const map = new Map<string, string>();
  for (const s of subs) {
    const key = s.weddingId ?? s.user?.weddingId;
    if (key && !map.has(key)) map.set(key, s.planId);
  }
  return map;
}

async function pessoasDosCasais(audience: Publico, now: Date): Promise<(PessoaDestinataria & { weddingId: string })[]> {
  if (audience.kind === "vendors") return [];
  const range = intervaloDaJanelaDeCasamento(audience.weddingWindow, now);
  const users = await prisma.user.findMany({
    where: {
      partnerVendorId: null,
      weddingId: audience.weddingIds?.length ? { in: audience.weddingIds } : { not: null },
      ...(range ? { wedding: { weddingDate: range } } : {}),
    },
    select: { id: true, username: true, name: true, weddingId: true },
    orderBy: { createdAt: "asc" },
    take: LIMITE_DE_CASAIS,
  });
  const plans = chavesDePlanoDoCasal(audience.couplePlans);
  const planMap = plans ? await planoDoCasalPorCasamento() : null;
  return users
    .filter((u): u is typeof u & { weddingId: string } => u.weddingId !== null)
    .filter((u) => {
      if (!plans || !planMap) return true;
      const plan = planMap.get(u.weddingId) ?? "basic";
      return plans.includes(plan);
    })
    .map((u) => ({ id: u.id, username: u.username, name: u.name, kind: "couple" as const, weddingId: u.weddingId }));
}

async function pessoasDosFornecedores(audience: Publico, now: Date): Promise<(PessoaDestinataria & { vendorId: string })[]> {
  if (audience.kind === "couples" || audience.weddingIds?.length) return []; // casais escolhidos à mão não levam fornecedores
  const tiers = chavesDeNivelDoFornecedor(audience.vendorPlans);
  const users = await prisma.user.findMany({
    where: { partnerVendorId: { not: null } },
    select: { id: true, username: true, name: true, partnerVendorId: true, partnerVendor: { select: { planTier: true, planExpiresAt: true } } },
    orderBy: { createdAt: "asc" },
    take: LIMITE_DE_CASAIS,
  });
  return users
    .filter((u) => {
      if (!tiers) return true;
      const v = u.partnerVendor;
      const effective = v && v.planTier !== "FREE" && (!v.planExpiresAt || v.planExpiresAt > now) ? v.planTier : "FREE";
      return tiers.includes(effective);
    })
    .map((u) => ({ id: u.id, username: u.username, name: u.name, kind: "vendor" as const, vendorId: u.partnerVendorId as string }));
}

/** Quem recebe, sem repetir ninguém. Passa de MAX_RECIPIENTS? Devolve o tamanho real para a tela recusar. */
export async function resolverPessoasDoPublico(audienceInput: unknown, now = new Date()): Promise<PessoaDestinataria[]> {
  await exigirAdminDaPlataforma();
  const audience = interpretarPublico(audienceInput);
  const [couples, vendors] = await Promise.all([pessoasDosCasais(audience, now), pessoasDosFornecedores(audience, now)]);
  const seen = new Set<string>();
  const out: PessoaDestinataria[] = [];
  for (const u of [...couples, ...vendors]) {
    if (seen.has(u.id)) continue;
    seen.add(u.id);
    out.push({ id: u.id, username: u.username, name: u.name, kind: u.kind });
  }
  return out;
}

/** "Chega a 83 casais de 1.236": contagem real, calculada na hora. */
export async function preverPublico(audienceInput: unknown, now = new Date()): Promise<PrevisaoDoPublico> {
  await exigirAdminDaPlataforma();
  const audience = interpretarPublico(audienceInput);
  const [couples, vendors, weddingTotal, vendorTotal] = await Promise.all([
    pessoasDosCasais(audience, now),
    pessoasDosFornecedores(audience, now),
    prisma.wedding.count(),
    prisma.partnerVendor.count(),
  ]);
  const people = new Set([...couples, ...vendors].map((u) => u.id)).size;
  return {
    couples: { matched: new Set(couples.map((u) => u.weddingId)).size, total: weddingTotal },
    vendors: { matched: new Set(vendors.map((u) => u.vendorId)).size, total: vendorTotal },
    people,
    tooMany: people > MAXIMO_DE_DESTINATARIOS,
  };
}

export interface LinhaDeRascunho {
  id: string;
  title: string;
  emailSubject: string | null;
  body: string;
  linkUrl: string | null;
  audience: Publico;
  channels: ("PANEL" | "PUSH" | "EMAIL" | "WHATSAPP")[];
  updatedAt: Date;
}

export async function listarRascunhos(): Promise<LinhaDeRascunho[]> {
  await exigirAdminDaPlataforma();
  const rows = await prisma.announcement.findMany({ where: { status: "DRAFT" }, orderBy: { updatedAt: "desc" }, take: 20 });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    emailSubject: r.emailSubject,
    body: r.body,
    linkUrl: r.linkUrl,
    audience: interpretarPublico(r.audience),
    channels: r.channels,
    updatedAt: r.updatedAt,
  }));
}

export interface LinhaDoHistorico {
  id: string;
  title: string;
  status: "SENDING" | "SENT";
  audience: Publico;
  channels: ("PANEL" | "PUSH" | "EMAIL" | "WHATSAPP")[];
  sentAt: Date | null;
  createdAt: Date;
  recipientCount: number;
  sent: number;
  failed: number;
  skipped: number;
  pending: number;
  /** Aviso no painel: lidos / enviados (null se o painel não foi um canal ou ninguém recebeu). */
  panelRead: { read: number; sent: number } | null;
}

/** Histórico: enviados e em envio, com contagens reais por situação dos destinatários. */
export async function listarHistorico(limit = 20): Promise<LinhaDoHistorico[]> {
  await exigirAdminDaPlataforma();
  const rows = await prisma.announcement.findMany({ where: { status: { in: ["SENDING", "SENT"] } }, orderBy: { createdAt: "desc" }, take: limit });
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [grouped, panelSent, panelRead] = await Promise.all([
    prisma.announcementRecipient.groupBy({ by: ["announcementId", "status"], where: { announcementId: { in: ids } }, _count: { _all: true } }),
    prisma.announcementRecipient.groupBy({ by: ["announcementId"], where: { announcementId: { in: ids }, channel: "PANEL", status: "SENT" }, _count: { _all: true } }),
    prisma.notification.groupBy({ by: ["dedupeKey"], where: { dedupeKey: { in: ids.map((id) => `announcement:${id}`) }, readAt: { not: null } }, _count: { _all: true } }),
  ]);
  const count = (id: string, status: string) => grouped.find((g) => g.announcementId === id && g.status === status)?._count._all ?? 0;
  return rows.map((r) => {
    const sentPanel = panelSent.find((p) => p.announcementId === r.id)?._count._all ?? 0;
    const read = panelRead.find((p) => p.dedupeKey === `announcement:${r.id}`)?._count._all ?? 0;
    return {
      id: r.id,
      title: r.title,
      status: r.status as "SENDING" | "SENT",
      audience: interpretarPublico(r.audience),
      channels: r.channels,
      sentAt: r.sentAt,
      createdAt: r.createdAt,
      recipientCount: r.recipientCount,
      sent: count(r.id, "SENT"),
      failed: count(r.id, "FAILED"),
      skipped: count(r.id, "SKIPPED"),
      pending: count(r.id, "PENDING"),
      panelRead: r.channels.includes("PANEL") && sentPanel > 0 ? { read, sent: sentPanel } : null,
    };
  });
}
