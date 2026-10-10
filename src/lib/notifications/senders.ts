import "server-only";
import prisma from "@/lib/prisma";
import { appUrl } from "@/lib/app-url";
import { brandedEmail, isEmailConfigured, sendEmail } from "@/lib/email";
import { isWhatsappConfigured, sendTextMessage } from "@/lib/evolution";
import { emailContent, whatsappText } from "./channel-texts.ts";
import type { FanOutDeps, FanOutItem } from "./fanout.ts";
import { DEFAULT_PREFS, resolvePrefs, type NotificationChannel, type NotificationPrefs } from "./preferences.ts";
import { sendPushNotification } from "./push.ts";
import { safeInternalHref } from "./push-payload.ts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Preferências salvas de cada pessoa; quem nunca mexeu fica de fora (vale o padrão). */
export async function loadPrefs(userIds: string[]): Promise<Map<string, NotificationPrefs>> {
  const rows = await prisma.notificationPreference.findMany({ where: { userId: { in: userIds } }, select: { userId: true, settings: true } });
  return new Map(rows.map((r) => [r.userId, resolvePrefs(r.settings)]));
}

export async function loadPrefsFor(userId: string): Promise<NotificationPrefs> {
  return (await loadPrefs([userId])).get(userId) ?? DEFAULT_PREFS;
}

/** Link absoluto do aviso, sempre a partir do endereço configurado (nunca do navegador). */
const linkOf = (item: FanOutItem) => appUrl(safeInternalHref(item.href));

/** WhatsApp do fornecedor ligado à conta. Conta de casal não tem telefone no cadastro: não envia. */
async function sendWhatsapp(item: FanOutItem): Promise<boolean> {
  if (!isWhatsappConfigured()) return false;
  const user = await prisma.user.findUnique({
    where: { id: item.userId },
    select: { partnerVendor: { select: { whatsapp: true, phone: true } } },
  });
  const phone = user?.partnerVendor?.whatsapp || user?.partnerVendor?.phone;
  if (!phone) return false;
  const result = await sendTextMessage({ phone, text: whatsappText(item, linkOf(item)) });
  return result.success === true;
}

/** E-mail só quando o login é um e-mail de verdade. */
async function sendEmailNotice(item: FanOutItem): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  const user = await prisma.user.findUnique({ where: { id: item.userId }, select: { username: true } });
  const to = user?.username && EMAIL_RE.test(user.username) ? user.username : null;
  if (!to) return false;
  const content = emailContent(item, linkOf(item), appUrl("/conta#avisos"));
  const { html, text } = brandedEmail({
    heading: content.heading,
    paragraphs: content.paragraphs,
    cta: content.cta,
    footnotes: content.footnotes,
    preheader: content.preheader,
  });
  const result = await sendEmail({ to, subject: content.subject, html, text });
  return result.sent;
}

/**
 * Envios reais de cada canal. Cada um devolve true se entregou ao serviço do canal e false se não
 * havia para onde enviar (sem aparelho cadastrado, sem telefone, serviço não configurado).
 */
const senders: Record<NotificationChannel, (item: FanOutItem) => Promise<boolean>> = {
  push: (item) => sendPushNotification(item.userId, item),
  whatsapp: sendWhatsapp,
  email: sendEmailNotice,
};

export function realFanOutDeps(): FanOutDeps {
  return { now: () => new Date(), loadPrefs, send: senders, defaults: DEFAULT_PREFS };
}
