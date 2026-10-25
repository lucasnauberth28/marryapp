import "server-only";
import prisma from "@/lib/prisma";
import { urlDoApp } from "@/lib/app-url";
import { brandedEmail, enviarEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/notifications/push";
import { buildPushPayload } from "@/lib/notifications/push-payload";
import { loadPrefs } from "@/lib/notifications/senders";
import { DEFAULT_PREFS, type NotificationPrefs } from "@/lib/notifications/preferences";
import {
  SKIP_TEXT,
  bodyParagraphs,
  decideDelivery,
  parseAudience,
  type Channel,
} from "@/lib/platform/announcement";
import type { RecipientUser } from "@/lib/platform/queries/comunicados";

/**
 * Envio dos comunicados. Idempotente em três camadas:
 *  1. o comunicado só sai de DRAFT para SENDING uma vez (updateMany condicional, em quem chama);
 *  2. cada pessoa e canal é uma linha única (announcement_recipients); reenviar nunca repete quem já recebeu;
 *  3. o aviso no painel tem dedupeKey "announcement:<id>" (único por pessoa).
 * Quem processa "reserva" a linha (sentAt) antes de enviar; uma reserva velha (processo interrompido) é liberada por
 * `releaseStaleClaims` quando a administração pede "Retomar envio".
 */

const BATCH = 40;
const EMAIL_CONCURRENCY = 3;
const STALE_CLAIM_MS = 3 * 60 * 1000;

interface AnnouncementContent {
  id: string;
  title: string;
  emailSubject: string | null;
  body: string;
  linkUrl: string | null;
  audience: unknown;
}

/** Cria as linhas de destinatário (PENDING, ou SKIPPED com o motivo). Pode rodar de novo sem duplicar. */
export async function queueRecipients(announcementId: string, users: RecipientUser[], channels: Channel[], service: boolean, now = new Date()): Promise<void> {
  const prefs = new Map<string, NotificationPrefs>();
  for (let i = 0; i < users.length; i += 500) {
    const chunk = users.slice(i, i + 500).map((u) => u.id);
    for (const [id, p] of await loadPrefs(chunk)) prefs.set(id, p);
  }
  const rows: { announcementId: string; userId: string; channel: Channel; status: "PENDING" | "SKIPPED"; error: string | null }[] = [];
  for (const user of users) {
    for (const channel of channels) {
      const decision = decideDelivery({ channel, service, username: user.username, prefs: prefs.get(user.id) ?? DEFAULT_PREFS, now });
      rows.push({ announcementId, userId: user.id, channel, status: decision.status, error: decision.status === "SKIPPED" ? SKIP_TEXT[decision.reason] : null });
    }
  }
  for (let i = 0; i < rows.length; i += 1000) {
    await prisma.announcementRecipient.createMany({ data: rows.slice(i, i + 1000), skipDuplicates: true });
  }
}

/** Libera as linhas reservadas há mais de 3 minutos que nunca terminaram (processo interrompido). */
export async function releaseStaleClaims(announcementId: string): Promise<number> {
  const res = await prisma.announcementRecipient.updateMany({
    where: { announcementId, status: "PENDING", sentAt: { lt: new Date(Date.now() - STALE_CLAIM_MS) } },
    data: { sentAt: null },
  });
  return res.count;
}

const failureText = (reason: string) => (reason === "not_configured" ? "E-mail não configurado no servidor" : reason === "invalid_recipient" ? SKIP_TEXT.no_email : "Falha no envio");

function emailFor(content: Pick<AnnouncementContent, "title" | "body" | "linkUrl">, service: boolean) {
  const { html, text } = brandedEmail({
    heading: content.title,
    preheader: content.body.slice(0, 100),
    paragraphs: bodyParagraphs(content.body),
    cta: content.linkUrl ? { label: "Abrir", url: content.linkUrl } : undefined,
    footnotes: service
      ? ["Este é um aviso sobre o funcionamento do Aceito."]
      : [`Para escolher quais avisos receber por e-mail, acesse ${urlDoApp("/conta#avisos")}.`],
  });
  return { html, text };
}

type Claimed = { id: string; userId: string; channel: string; user: { username: string } };

async function finish(id: string, status: "SENT" | "FAILED", error?: string) {
  await prisma.announcementRecipient.update({
    where: { id },
    data: { status, error: error ?? null, sentAt: new Date() },
  });
}

/** Processa tudo o que está PENDING deste comunicado, em lotes. Nunca lança: erros ficam na linha de cada pessoa. */
export async function processAnnouncement(announcementId: string): Promise<void> {
  try {
    const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } });
    if (!announcement || announcement.status === "DRAFT" || announcement.status === "CANCELED") return;
    const service = parseAudience(announcement.audience).service;
    const content = { title: announcement.title, body: announcement.body, linkUrl: announcement.linkUrl };
    const subject = announcement.emailSubject?.trim() || announcement.title;
    const mail = emailFor(content, service);

    for (;;) {
      const pending = await prisma.announcementRecipient.findMany({
        where: { announcementId, status: "PENDING", sentAt: null },
        orderBy: { id: "asc" },
        take: BATCH,
        select: { id: true, userId: true, channel: true, user: { select: { username: true } } },
      });
      if (pending.length === 0) break;

      // Reserva as linhas deste lote (se outro processo reservou antes, o updateMany não pega e a linha é pulada)
      const claimed: Claimed[] = [];
      for (const row of pending) {
        const res = await prisma.announcementRecipient.updateMany({ where: { id: row.id, status: "PENDING", sentAt: null }, data: { sentAt: new Date() } });
        if (res.count === 1) claimed.push(row);
      }

      // Aviso no painel: uma gravação só para o lote (a chave única protege de repetição)
      const panel = claimed.filter((r) => r.channel === "PANEL");
      if (panel.length > 0) {
        try {
          await prisma.notification.createMany({
            data: panel.map((r) => ({
              userId: r.userId,
              type: "announcement",
              title: announcement.title.slice(0, 200),
              body: announcement.body.slice(0, 1000),
              href: announcement.linkUrl,
              dedupeKey: `announcement:${announcementId}`,
            })),
            skipDuplicates: true,
          });
          await prisma.announcementRecipient.updateMany({ where: { id: { in: panel.map((r) => r.id) } }, data: { status: "SENT", error: null, sentAt: new Date() } });
        } catch (error) {
          console.error("[comunicados] painel:", error instanceof Error ? error.message : error);
          await prisma.announcementRecipient.updateMany({ where: { id: { in: panel.map((r) => r.id) } }, data: { status: "FAILED", error: "Falha ao gravar o aviso", sentAt: new Date() } });
        }
      }

      // Notificação no celular: uma pessoa por vez (cada uma pode ter vários aparelhos)
      for (const row of claimed.filter((r) => r.channel === "PUSH")) {
        const report = await sendPushToUser(row.userId, buildPushPayload({ title: announcement.title, body: announcement.body, href: announcement.linkUrl, dedupeKey: `announcement:${announcementId}` }));
        if (report.devices === 0) await prisma.announcementRecipient.update({ where: { id: row.id }, data: { status: "SKIPPED", error: SKIP_TEXT.no_device, sentAt: new Date() } });
        else if (report.sent > 0) await finish(row.id, "SENT");
        else await finish(row.id, "FAILED", "Falha no envio");
      }

      // E-mail: poucos de cada vez, para respeitar o limite do serviço
      const emails = claimed.filter((r) => r.channel === "EMAIL");
      for (let i = 0; i < emails.length; i += EMAIL_CONCURRENCY) {
        await Promise.all(
          emails.slice(i, i + EMAIL_CONCURRENCY).map(async (row) => {
            const result = await enviarEmail({ to: row.user.username, subject, html: mail.html, text: mail.text });
            if (result.sent) await finish(row.id, "SENT");
            else await finish(row.id, "FAILED", failureText(result.reason));
          }),
        );
      }
    }

    await refreshAnnouncementTotals(announcementId);
  } catch (error) {
    console.error("[comunicados] processamento:", error instanceof Error ? error.message : error);
  }
}

/** Recalcula os números do comunicado e o encerra (SENT) quando não resta nada pendente. */
export async function refreshAnnouncementTotals(announcementId: string): Promise<void> {
  const grouped = await prisma.announcementRecipient.groupBy({ by: ["status"], where: { announcementId }, _count: { _all: true } });
  const n = (s: string) => grouped.find((g) => g.status === s)?._count._all ?? 0;
  const people = await prisma.announcementRecipient.findMany({ where: { announcementId }, distinct: ["userId"], select: { userId: true } });
  const done = n("PENDING") === 0;
  await prisma.announcement.updateMany({
    where: { id: announcementId, status: { in: ["SENDING", "SENT"] } },
    data: { recipientCount: people.length, deliveredCount: n("SENT"), failedCount: n("FAILED"), ...(done ? { status: "SENT", sentAt: new Date() } : {}) },
  });
}

/** Teste: manda só para a pessoa da administração, sem registrar destinatários nem contar no histórico. */
export async function sendAnnouncementTest(
  admin: { userId: string },
  input: { title: string; emailSubject: string; body: string; linkUrl: string | null; channels: Channel[]; service: boolean },
): Promise<{ done: string[]; notes: string[] }> {
  const done: string[] = [];
  const notes: string[] = [];
  const user = await prisma.user.findUnique({ where: { id: admin.userId }, select: { id: true, username: true } });
  if (!user) return { done, notes: ["A conta de emergência não é um usuário cadastrado, então não recebe testes. Entre com uma conta da equipe."] };
  const title = `[Teste] ${input.title}`.slice(0, 200);
  if (input.channels.includes("PANEL")) {
    await prisma.notification.create({
      data: { userId: user.id, type: "announcement", title, body: input.body.slice(0, 1000), href: input.linkUrl, dedupeKey: `announcement-test:${crypto.randomUUID()}` },
    });
    done.push("aviso no painel");
  }
  if (input.channels.includes("PUSH")) {
    const report = await sendPushToUser(user.id, buildPushPayload({ title, body: input.body, href: input.linkUrl, dedupeKey: "announcement-test" }));
    if (report.sent > 0) done.push("notificação no celular");
    else notes.push(report.devices === 0 ? "Notificação: você não tem aparelho com avisos ativados." : "Notificação: não foi possível enviar.");
  }
  if (input.channels.includes("EMAIL")) {
    const mail = emailFor({ title, body: input.body, linkUrl: input.linkUrl }, input.service);
    const result = await enviarEmail({ to: user.username, subject: `[Teste] ${input.emailSubject.trim() || input.title}`, html: mail.html, text: mail.text });
    if (result.sent) done.push("e-mail");
    else notes.push(`E-mail: ${failureText(result.reason)}.`);
  }
  return { done, notes };
}
