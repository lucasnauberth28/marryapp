import "server-only";
import prisma from "@/lib/prisma";
import { urlDoApp } from "@/lib/app-url";
import { brandedEmail, emailEstaConfigurado, enviarEmail } from "@/lib/email";
import { whatsappEstaConfigurado, enviarMensagemDeTexto } from "@/lib/evolution";
import { conteudoDoEmail, textoDoWhatsapp } from "./channel-texts.ts";
import type { DependenciasDaDistribuicao, ItemDaDistribuicao } from "./fanout.ts";
import { PREFERENCIAS_PADRAO, resolverPreferencias, type CanalDeNotificacao, type PreferenciasDeNotificacao } from "./preferences.ts";
import { enviarNotificacaoPush } from "./push.ts";
import { linkInternoSeguro } from "./push-payload.ts";

const PADRAO_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Preferências salvas de cada pessoa; quem nunca mexeu fica de fora (vale o padrão). */
export async function carregarPreferencias(userIds: string[]): Promise<Map<string, PreferenciasDeNotificacao>> {
  const rows = await prisma.notificationPreference.findMany({ where: { userId: { in: userIds } }, select: { userId: true, settings: true } });
  return new Map(rows.map((r) => [r.userId, resolverPreferencias(r.settings)]));
}

export async function carregarPreferenciasDe(userId: string): Promise<PreferenciasDeNotificacao> {
  return (await carregarPreferencias([userId])).get(userId) ?? PREFERENCIAS_PADRAO;
}

/** Link absoluto do aviso, sempre a partir do endereço configurado (nunca do navegador). */
const linkDe = (item: ItemDaDistribuicao) => urlDoApp(linkInternoSeguro(item.href));

/** WhatsApp do fornecedor ligado à conta. Conta de casal não tem telefone no cadastro: não envia. */
async function enviarPorWhatsapp(item: ItemDaDistribuicao): Promise<boolean> {
  if (!whatsappEstaConfigurado()) return false;
  const user = await prisma.user.findUnique({
    where: { id: item.userId },
    select: { partnerVendor: { select: { whatsapp: true, phone: true } } },
  });
  const phone = user?.partnerVendor?.whatsapp || user?.partnerVendor?.phone;
  if (!phone) return false;
  const result = await enviarMensagemDeTexto({ phone, text: textoDoWhatsapp(item, linkDe(item)) });
  return result.success === true;
}

/** E-mail só quando o login é um e-mail de verdade. */
async function enviarAvisoPorEmail(item: ItemDaDistribuicao): Promise<boolean> {
  if (!emailEstaConfigurado()) return false;
  const user = await prisma.user.findUnique({ where: { id: item.userId }, select: { username: true } });
  const to = user?.username && PADRAO_DE_EMAIL.test(user.username) ? user.username : null;
  if (!to) return false;
  const content = conteudoDoEmail(item, linkDe(item), urlDoApp("/conta#avisos"));
  const { html, text } = brandedEmail({
    heading: content.heading,
    paragraphs: content.paragraphs,
    cta: content.cta,
    footnotes: content.footnotes,
    preheader: content.preheader,
  });
  const result = await enviarEmail({ to, subject: content.subject, html, text });
  return result.sent;
}

/**
 * Envios reais de cada canal. Cada um devolve true se entregou ao serviço do canal e false se não
 * havia para onde enviar (sem aparelho cadastrado, sem telefone, serviço não configurado).
 */
const enviadores: Record<CanalDeNotificacao, (item: ItemDaDistribuicao) => Promise<boolean>> = {
  push: (item) => enviarNotificacaoPush(item.userId, item),
  whatsapp: enviarPorWhatsapp,
  email: enviarAvisoPorEmail,
};

export function dependenciasReaisDaDistribuicao(): DependenciasDaDistribuicao {
  return { now: () => new Date(), loadPrefs: carregarPreferencias, send: enviadores, defaults: PREFERENCIAS_PADRAO };
}
