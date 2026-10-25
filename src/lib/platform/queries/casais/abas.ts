// Consultas dos casais para a administração: o que cada aba do casal mostra. Só números de convidados, nunca dados deles.
import "server-only";
import prisma from "@/lib/prisma";
import { filtroSemSoPresente } from "@/lib/guest-origin";
import { formatarReais } from "../../../formatacao/dinheiro.ts";
import { ehPixEstatico } from "@/lib/platform/payments";

export interface ItemDaLinhaDoTempo {
  id: string;
  at: Date;
  text: string;
  /** Aviso ao lado do texto (ex.: "Aguardando conferência"). */
  badge?: { tone: "aviso" | "sucesso" | "perigo" | "neutro"; label: string };
}

const TEXTO_DA_AUDITORIA: Record<string, string> = {
  "wedding.suspend": "Casamento suspenso pela equipe",
  "wedding.unsuspend": "Casamento reativado pela equipe",
  "wedding.flag": "Marcado para acompanhar",
  "wedding.unflag": "Deixou de ser acompanhado",
  "wedding.note_add": "A equipe registrou uma nota interna",
  "wedding.grant_plan": "A equipe concedeu um plano",
  "wedding.password_reset": "A equipe enviou um link de nova senha",
  "impersonation.start": "A equipe entrou no painel como o casal",
  "impersonation.end": "A equipe saiu do painel do casal",
  "impersonation.write": "A equipe alterou dados como o casal",
  "refund.request": "Pedido de reembolso registrado",
  "subscription.confirm": "Pix do plano conferido pela equipe",
};

/** Linha do tempo real: registro da equipe + cadastro, plano, presentes e domínio. Cada item com data verdadeira. */
export async function obterLinhaDoTempoDoCasal(id: string, limit = 8): Promise<ItemDaLinhaDoTempo[]> {
  const w = await prisma.wedding.findUnique({ where: { id }, select: { createdAt: true, onboardedAt: true } });
  if (!w) return [];
  const [audits, subs, gifts, orders] = await Promise.all([
    prisma.auditLog.findMany({ where: { targetType: "wedding", targetId: id }, orderBy: { createdAt: "desc" }, take: limit, select: { id: true, action: true, createdAt: true } }),
    prisma.subscription.findMany({
      where: { planType: "COUPLE", OR: [{ weddingId: id }, { weddingId: null, user: { weddingId: id } }] },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, planName: true, amount: true, status: true, createdAt: true, paidAt: true, gatewayId: true },
    }),
    prisma.transaction.findMany({ where: { weddingId: id, status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: limit, select: { id: true, amount: true, paymentMethod: true, createdAt: true } }),
    prisma.domainOrder.findMany({ where: { weddingId: id }, orderBy: { requestedAt: "desc" }, take: 3, select: { id: true, domain: true, requestedAt: true, connectedAt: true } }),
  ]);

  const items: ItemDaLinhaDoTempo[] = [];
  for (const a of audits) items.push({ id: `a-${a.id}`, at: a.createdAt, text: TEXTO_DA_AUDITORIA[a.action] ?? `Registro: ${a.action}` });
  for (const s of subs) {
    const pix = ehPixEstatico(s.gatewayId);
    if (s.status === "APPROVED" && s.paidAt) items.push({ id: `sp-${s.id}`, at: s.paidAt, text: `Pagou o plano ${s.planName} (${formatarReais(s.amount)})`, badge: { tone: "sucesso", label: "Pago" } });
    if (s.status === "PENDING") items.push({ id: `sg-${s.id}`, at: s.createdAt, text: `Gerou o ${pix ? "Pix" : "pagamento"} do plano ${s.planName} (${formatarReais(s.amount)})`, badge: pix ? { tone: "aviso", label: "Aguardando conferência" } : { tone: "aviso", label: "Aguardando" } });
    if (s.status === "REJECTED" || s.status === "FAILED") items.push({ id: `sf-${s.id}`, at: s.createdAt, text: `Pagamento do plano ${s.planName} (${formatarReais(s.amount)}) não passou`, badge: { tone: "perigo", label: "Recusado" } });
  }
  for (const g of gifts) items.push({ id: `g-${g.id}`, at: g.createdAt, text: `Recebeu um presente de ${formatarReais(g.amount)}${g.paymentMethod === "PIX" ? " por Pix" : ""}` });
  for (const o of orders) {
    items.push({ id: `d-${o.id}`, at: o.requestedAt, text: `Pediu o domínio ${o.domain}` });
    if (o.connectedAt) items.push({ id: `dc-${o.id}`, at: o.connectedAt, text: `Domínio ${o.domain} no ar` });
  }
  if (w.onboardedAt) items.push({ id: "onboarded", at: w.onboardedAt, text: "Concluiu o onboarding" });
  items.push({ id: "created", at: w.createdAt, text: "Criou a conta" });

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

function metodoDaAssinatura(gatewayId: string | null) {
  if (ehPixEstatico(gatewayId)) return "Pix" as const;
  return gatewayId?.startsWith("MANUAL") ? ("Cortesia" as const) : ("Mercado Pago" as const);
}

export async function obterPagamentosDoCasal(id: string) {
  const subs = await prisma.subscription.findMany({
    where: { planType: "COUPLE", OR: [{ weddingId: id }, { weddingId: null, user: { weddingId: id } }] },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      planId: true,
      planName: true,
      amount: true,
      status: true,
      gatewayId: true,
      createdAt: true,
      paidAt: true,
      refundRequests: { orderBy: { createdAt: "desc" }, select: { id: true, amount: true, status: true, createdAt: true, reason: true } },
    },
  });
  return subs.map((s) => ({
    ...s,
    method: metodoDaAssinatura(s.gatewayId),
  }));
}

/** Convidados e presentes: só números. Nunca nome, telefone, e-mail ou restrição de convidado. */
export async function obterNumerosDeConvidadosDoCasal(id: string) {
  const [byStatus, invited, noPhone, gifts] = await Promise.all([
    prisma.guest.groupBy({ by: ["rsvpStatus"], where: { weddingId: id, ...filtroSemSoPresente }, _count: { _all: true } }),
    prisma.guest.count({ where: { weddingId: id, hasReceivedMessage: true, ...filtroSemSoPresente } }),
    prisma.guest.count({ where: { weddingId: id, phone: null, ...filtroSemSoPresente } }),
    prisma.transaction.aggregate({ where: { weddingId: id, status: "APPROVED" }, _sum: { amount: true, fee: true }, _count: { _all: true } }),
  ]);
  const count = (s: string) => byStatus.find((g) => g.rsvpStatus === s)?._count._all ?? 0;
  return {
    total: byStatus.reduce((n, g) => n + g._count._all, 0),
    confirmed: count("CONFIRMED"),
    declined: count("DECLINED"),
    pending: count("PENDING"),
    invited,
    noPhone,
    giftsCents: gifts._sum.amount ?? 0,
    giftsCount: gifts._count._all,
    feesCents: gifts._sum.fee ?? 0,
  };
}

export async function obterAtividadeDoCasal(id: string) {
  const members = await prisma.user.findMany({ where: { weddingId: id }, select: { id: true } });
  const [audits, notifications] = await Promise.all([
    prisma.auditLog.findMany({ where: { targetType: "wedding", targetId: id }, orderBy: { createdAt: "desc" }, take: 15, select: { id: true, action: true, actorName: true, createdAt: true } }),
    prisma.notification.findMany({ where: { userId: { in: members.map((m) => m.id) } }, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, title: true, readAt: true, createdAt: true } }),
  ]);
  return {
    audits: audits.map((a) => ({ id: a.id, at: a.createdAt, text: TEXTO_DA_AUDITORIA[a.action] ?? a.action, actor: a.actorName })),
    notifications,
  };
}

export async function obterDominioDoCasal(id: string) {
  return prisma.domainOrder.findMany({
    where: { weddingId: id },
    orderBy: { requestedAt: "desc" },
    take: 5,
    select: { id: true, domain: true, status: true, requestedAt: true, registeredAt: true, connectedAt: true, expiresAt: true },
  });
}

export async function obterSuporteDoCasal(id: string) {
  const [notes, tickets] = await Promise.all([
    prisma.adminNote.findMany({ where: { weddingId: id }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, authorName: true, body: true, createdAt: true } }),
    prisma.supportTicket.findMany({ where: { weddingId: id }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, number: true, subject: true, status: true, createdAt: true } }),
  ]);
  return { notes, tickets };
}

export async function obterMadrinhaDoCasal(id: string) {
  return prisma.madrinhaWeddingOverride.findUnique({ where: { weddingId: id }, select: { enabled: true, extraMessages: true, blockedAt: true, blockedReason: true } });
}
