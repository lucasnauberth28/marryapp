import "server-only";
import { VendorPlanTier } from "@prisma/client";
import prisma from "@/lib/prisma";
import { appUrl } from "@/lib/app-url";
import { brandedEmail, sendEmail } from "@/lib/email";
import { sendTextMessage } from "@/lib/evolution";
import { dueReminder, reminderWindowEnd, type PlanReminderDay } from "@/lib/plan-reminders";
import { notifyPlanExpiring } from "@/lib/notifications/cron";
import { DEFAULT_PREFS, decideChannels } from "@/lib/notifications/preferences";
import { loadPrefsFor } from "@/lib/notifications/senders";

const TIER_NAME: Record<string, string> = { PRO: "Pro", MASTER: "Master Elite" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "America/Sao_Paulo" });
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

function isWhatsappConfigured() {
  return Boolean(process.env.EVOLUTION_API_URL?.trim() && process.env.EVOLUTION_API_KEY?.trim() && process.env.EVOLUTION_INSTANCE?.trim());
}

const SP_OFFSET_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3)
const dayKey = (d: Date) => new Date(d.getTime() - SP_OFFSET_MS).toISOString().slice(0, 10);

function reminderTexts(day: PlanReminderDay, planName: string, companyName: string, expiresAt: Date, now: Date) {
  const link = appUrl("/fornecedor/plano");
  const relative = dayKey(expiresAt) === dayKey(now) ? "hoje" : "amanhã";
  const when =
    day === 1 ? `${relative}, ${dateFmt.format(expiresAt)}, às ${timeFmt.format(expiresAt)}` : `em ${dateFmt.format(expiresAt)}`;
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  const heading = day === 1 ? `Seu plano ${planName} vence ${relative}` : `Seu plano ${planName} vence em ${daysLeft} dias`;
  const body = `O plano ${planName} de ${companyName} no Aceito vence ${when}. Depois disso o perfil volta ao Start, com até 3 pedidos por mês.`;
  const renew = "Renovar antes do vencimento soma 30 dias aos que ainda faltam, sem perder nada.";
  const whatsapp = `Oi! ${body}\n\n${renew}\n\nRenove pelo Pix aqui: ${link}`;
  const email = brandedEmail({
    heading,
    paragraphs: [body, renew],
    cta: { label: "Renovar com Pix", url: link },
    footnotes: ["O pagamento é por Pix e não há renovação automática."],
    preheader: `Vence ${when}.`,
  });
  return { subject: heading, whatsapp, email };
}

export interface ReminderRunResult {
  checked: number;
  sent: number;
}

/**
 * Avisa por WhatsApp (se configurado e houver telefone) e e-mail (se o login for um e-mail)
 * os fornecedores com plano pago perto de vencer: 7 dias e 1 dia antes, uma vez cada por período.
 */
export async function sendVendorPlanReminders(now = new Date()): Promise<ReminderRunResult> {
  const vendors = await prisma.partnerVendor.findMany({
    where: {
      planTier: { not: VendorPlanTier.FREE },
      planExpiresAt: { gt: now, lte: reminderWindowEnd(now) },
    },
    select: {
      id: true,
      companyName: true,
      phone: true,
      whatsapp: true,
      planTier: true,
      planExpiresAt: true,
      planReminderDays: true,
      user: { select: { id: true, username: true } },
    },
  });

  let sent = 0;
  const whatsappReady = isWhatsappConfigured();

  for (const vendor of vendors) {
    const day = dueReminder({ expiresAt: vendor.planExpiresAt, now, lastSent: vendor.planReminderDays });
    if (!day || !vendor.planExpiresAt) continue;

    // Marca antes de enviar: se a rotina rodar duas vezes ao mesmo tempo, só uma envia.
    const claimed = await prisma.partnerVendor.updateMany({
      where: { id: vendor.id, planReminderDays: vendor.planReminderDays, planExpiresAt: vendor.planExpiresAt },
      data: { planReminderDays: day },
    });
    if (claimed.count === 0) continue;

    // Aviso no sino (e push) além do WhatsApp e do e-mail abaixo; nunca lança erro.
    await notifyPlanExpiring({
      vendorId: vendor.id,
      planName: TIER_NAME[vendor.planTier] ?? "pago",
      expiresAt: vendor.planExpiresAt,
      day,
      now,
    });

    const texts = reminderTexts(day, TIER_NAME[vendor.planTier] ?? "pago", vendor.companyName, vendor.planExpiresAt, now);
    const phone = vendor.whatsapp || vendor.phone;
    const email = vendor.user?.username && EMAIL_RE.test(vendor.user.username) ? vendor.user.username : null;

    // Respeita as escolhas de "Avisos" da pessoa (padrão: WhatsApp e e-mail ligados, como sempre foi)
    const prefs = vendor.user?.id ? await loadPrefsFor(vendor.user.id).catch(() => DEFAULT_PREFS) : DEFAULT_PREFS;
    // O horário de silêncio não entra aqui: a rotina já roda às 8h e o aviso de cada período sai uma vez só.
    const channels = decideChannels({ type: "plan_expiring", prefs: { ...prefs, quietHours: { ...prefs.quietHours, enabled: false } }, now });

    let attempted = 0;
    let delivered = 0;
    if (whatsappReady && phone && channels.includes("whatsapp")) {
      attempted++;
      const res = await sendTextMessage({ phone, text: texts.whatsapp }).catch(() => ({ success: false }));
      if (res.success) delivered++;
    }
    if (email && channels.includes("email")) {
      const res = await sendEmail({ to: email, subject: texts.subject, ...texts.email });
      // Sem RESEND_API_KEY o envio é ignorado de propósito: não conta como falha.
      if (res.sent || res.reason !== "not_configured") attempted++;
      if (res.sent) delivered++;
    }

    if (attempted > 0 && delivered === 0) {
      // Todos os canais falharam: desfaz a marca para tentar de novo na próxima rodada.
      await prisma.partnerVendor.updateMany({
        where: { id: vendor.id, planReminderDays: day },
        data: { planReminderDays: vendor.planReminderDays },
      });
      console.warn(`[Avisos de plano] Falha ao avisar o fornecedor ${vendor.id} (${day} dia(s) antes).`);
      continue;
    }
    if (delivered > 0) sent++;
  }

  return { checked: vendors.length, sent };
}
