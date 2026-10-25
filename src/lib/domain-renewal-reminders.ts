import "server-only";
import prisma from "@/lib/prisma";
import { appUrl } from "@/lib/app-url";
import { brandedEmail, sendEmail } from "@/lib/email";
import { dueRenewalReminder, renewalWindowEnd, type RenewalReminderDay } from "@/lib/domain-renewal";
import { logAudit } from "@/lib/audit";

import { formatarDataCivilLonga } from "./formatacao/data.ts";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// O vencimento é uma data de calendário (meia-noite UTC): formatar em UTC evita voltar um dia.

export interface DomainReminderResult {
  checked: number;
  sent: number;
}

/**
 * Avisa por e-mail o casal (os logins do casamento e o e-mail do titular) 60 e 30 dias antes do vencimento do domínio
 * próprio, uma vez cada por período. A renovação é manual no Registro.br: o aviso diz isso e pede que respondam à equipe.
 * Marca antes de enviar (duas execuções ao mesmo tempo não repetem) e desfaz a marca se todos os envios falharem.
 */
export async function sendDomainRenewalReminders(now = new Date()): Promise<DomainReminderResult> {
  const orders = await prisma.domainOrder.findMany({
    where: { status: { in: ["REGISTERED", "CONNECTED"] }, expiresAt: { gt: now, lte: renewalWindowEnd(now) } },
    select: {
      id: true,
      domain: true,
      holderEmail: true,
      expiresAt: true,
      renewalReminderDays: true,
      wedding: { select: { coupleNames: true, members: { select: { username: true } } } },
    },
  });

  let sent = 0;
  for (const order of orders) {
    const day = dueRenewalReminder({ expiresAt: order.expiresAt, now, lastSent: order.renewalReminderDays });
    if (!day || !order.expiresAt) continue;

    const claimed = await prisma.domainOrder.updateMany({
      where: { id: order.id, renewalReminderDays: order.renewalReminderDays, expiresAt: order.expiresAt },
      data: { renewalReminderDays: day },
    });
    if (claimed.count === 0) continue;

    const recipients = [...new Set([...order.wedding.members.map((m) => m.username), order.holderEmail].map((e) => e.trim().toLowerCase()).filter((e) => EMAIL_RE.test(e)))];
    const delivered = await sendToAll(recipients, order.domain, order.expiresAt, day);

    if (recipients.length > 0 && delivered === 0) {
      await prisma.domainOrder.updateMany({ where: { id: order.id, renewalReminderDays: day }, data: { renewalReminderDays: order.renewalReminderDays } });
      console.warn(`[Avisos de domínio] Falha ao avisar o pedido ${order.id} (${day} dias antes).`);
      continue;
    }
    if (delivered > 0) {
      sent++;
      await logAudit({ action: "domain.renewal_reminder", targetType: "DomainOrder", targetId: order.id, actor: { id: null, name: "Rotina diária" }, details: { day, recipients: delivered } });
    }
  }
  return { checked: orders.length, sent };
}

async function sendToAll(recipients: string[], domain: string, expiresAt: Date, day: RenewalReminderDay): Promise<number> {
  const when = formatarDataCivilLonga(expiresAt);
  const heading = `O endereço ${domain} do site vence em ${when}`;
  const mail = brandedEmail({
    heading,
    paragraphs: [
      `O endereço ${domain} do site de vocês vence em ${when}, daqui a cerca de ${day} dias.`,
      "A renovação do .com.br é feita no Registro.br. Para o site de vocês não sair do ar, confiram no painel as condições da renovação.",
    ],
    cta: { label: "Ver o endereço do site", url: appUrl("/dominio") },
    footnotes: ["Este aviso sai uma vez aos 60 dias e outra aos 30 dias antes do vencimento."],
    preheader: `Vence em ${when}.`,
  });
  let delivered = 0;
  for (const to of recipients) {
    const res = await sendEmail({ to, subject: heading, html: mail.html, text: mail.text });
    if (res.sent) delivered++;
  }
  return delivered;
}
