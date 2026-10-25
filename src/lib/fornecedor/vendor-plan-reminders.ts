import "server-only";
import { VendorPlanTier } from "@prisma/client";
import prisma from "@/lib/prisma";
import { urlDoApp } from "@/lib/app-url";
import { emailDaMarca, enviarEmail } from "@/lib/email/email";
import { whatsappEstaConfigurado } from "@/lib/whatsapp/config";
import { enviarMensagemDeTexto } from "@/lib/whatsapp/mensagens";
import { lembreteDevido, fimDaJanelaDoLembrete, type DiaDoLembreteDoPlano } from "@/lib/pagamento/plan-reminders";
import { avisarPlanoPrestesAVencer } from "@/lib/notifications/cron";
import { PREFERENCIAS_PADRAO, decidirCanais } from "@/lib/notifications/preferences";
import { carregarPreferenciasDe } from "@/lib/notifications/senders";

import { formatarDataBrasiliaSemAno } from "../formatacao/data.ts";
const NOME_DO_NIVEL: Record<string, string> = { PRO: "Pro", MASTER: "Master Elite" };
const PADRAO_DE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const formatoDaHora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

const DESLOCAMENTO_DE_BRASILIA_EM_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3)
const chaveDoDia = (d: Date) => new Date(d.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS).toISOString().slice(0, 10);

function textosDoLembrete(day: DiaDoLembreteDoPlano, planName: string, companyName: string, expiresAt: Date, now: Date) {
  const link = urlDoApp("/fornecedor/plano");
  const relative = chaveDoDia(expiresAt) === chaveDoDia(now) ? "hoje" : "amanhã";
  const when =
    day === 1 ? `${relative}, ${formatarDataBrasiliaSemAno(expiresAt)}, às ${formatoDaHora.format(expiresAt)}` : `em ${formatarDataBrasiliaSemAno(expiresAt)}`;
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  const heading = day === 1 ? `Seu plano ${planName} vence ${relative}` : `Seu plano ${planName} vence em ${daysLeft} dias`;
  const body = `O plano ${planName} de ${companyName} no Aceito vence ${when}. Depois disso o perfil volta ao Start, com até 3 pedidos por mês.`;
  const renew = "Renovar antes do vencimento soma 30 dias aos que ainda faltam, sem perder nada.";
  const whatsapp = `Oi! ${body}\n\n${renew}\n\nRenove pelo Pix aqui: ${link}`;
  const email = emailDaMarca({
    heading,
    paragraphs: [body, renew],
    cta: { label: "Renovar com Pix", url: link },
    footnotes: ["O pagamento é por Pix e não há renovação automática."],
    preheader: `Vence ${when}.`,
  });
  return { subject: heading, whatsapp, email };
}

export interface ResultadoDaRodadaDeLembretes {
  checked: number;
  sent: number;
}

const SELECAO_DO_FORNECEDOR = {
  id: true,
  companyName: true,
  phone: true,
  whatsapp: true,
  planTier: true,
  planExpiresAt: true,
  planReminderDays: true,
  user: { select: { id: true, username: true } },
} as const;

type FornecedorComPlano = Awaited<ReturnType<typeof buscarFornecedoresComPlanoPerto>>[number];

function buscarFornecedoresComPlanoPerto(now: Date) {
  return prisma.partnerVendor.findMany({
    where: { planTier: { not: VendorPlanTier.FREE }, planExpiresAt: { gt: now, lte: fimDaJanelaDoLembrete(now) } },
    select: SELECAO_DO_FORNECEDOR,
  });
}

/** Quais canais a pessoa deixou ligados em "Avisos" (padrão: WhatsApp e e-mail, como sempre foi). */
async function canaisDoLembrete(userId: string | undefined, now: Date) {
  const prefs = userId ? await carregarPreferenciasDe(userId).catch(() => PREFERENCIAS_PADRAO) : PREFERENCIAS_PADRAO;
  // O horário de silêncio não entra aqui: a rotina já roda às 8h e o aviso de cada período sai uma vez só.
  return decidirCanais({ type: "plan_expiring", prefs: { ...prefs, quietHours: { ...prefs.quietHours, enabled: false } }, now });
}

/** Manda o lembrete pelos canais ligados; conta quantos foram tentados e quantos chegaram. */
async function enviarPelosCanais(vendor: FornecedorComPlano, day: DiaDoLembreteDoPlano, now: Date, whatsappReady: boolean) {
  const planName = NOME_DO_NIVEL[vendor.planTier] ?? "pago";
  const texts = textosDoLembrete(day, planName, vendor.companyName, vendor.planExpiresAt as Date, now);
  const phone = vendor.whatsapp || vendor.phone;
  const email = vendor.user?.username && PADRAO_DE_EMAIL.test(vendor.user.username) ? vendor.user.username : null;
  const channels = await canaisDoLembrete(vendor.user?.id, now);

  let attempted = 0;
  let delivered = 0;
  if (whatsappReady && phone && channels.includes("whatsapp")) {
    attempted++;
    const res = await enviarMensagemDeTexto({ phone, text: texts.whatsapp }).catch(() => ({ success: false }));
    if (res.success) delivered++;
  }
  if (email && channels.includes("email")) {
    const res = await enviarEmail({ to: email, subject: texts.subject, ...texts.email });
    // Sem RESEND_API_KEY o envio é ignorado de propósito: não conta como falha.
    if (res.sent || res.reason !== "not_configured") attempted++;
    if (res.sent) delivered++;
  }
  return { attempted, delivered };
}

/** Avisa um fornecedor. Devolve true se algum canal entregou; false se todos falharam (e a marca foi desfeita). */
async function avisarFornecedor(vendor: FornecedorComPlano, day: DiaDoLembreteDoPlano, now: Date, whatsappReady: boolean): Promise<boolean> {
  const expiresAt = vendor.planExpiresAt as Date;
  // Aviso no sino (e push) além do WhatsApp e do e-mail abaixo; nunca lança erro.
  await avisarPlanoPrestesAVencer({ vendorId: vendor.id, planName: NOME_DO_NIVEL[vendor.planTier] ?? "pago", expiresAt, day, now });

  const { attempted, delivered } = await enviarPelosCanais(vendor, day, now, whatsappReady);
  if (attempted > 0 && delivered === 0) {
    // Todos os canais falharam: desfaz a marca para tentar de novo na próxima rodada.
    await prisma.partnerVendor.updateMany({ where: { id: vendor.id, planReminderDays: day }, data: { planReminderDays: vendor.planReminderDays } });
    console.warn(`[Avisos de plano] Falha ao avisar o fornecedor ${vendor.id} (${day} dia(s) antes).`);
    return false;
  }
  return delivered > 0;
}

/**
 * Avisa por WhatsApp (se configurado e houver telefone) e e-mail (se o login for um e-mail)
 * os fornecedores com plano pago perto de vencer: 7 dias e 1 dia antes, uma vez cada por período.
 */
export async function enviarLembretesDoPlanoDoFornecedor(now = new Date()): Promise<ResultadoDaRodadaDeLembretes> {
  const vendors = await buscarFornecedoresComPlanoPerto(now);
  const whatsappReady = whatsappEstaConfigurado();
  let sent = 0;

  for (const vendor of vendors) {
    const day = lembreteDevido({ expiresAt: vendor.planExpiresAt, now, lastSent: vendor.planReminderDays });
    if (!day || !vendor.planExpiresAt) continue;

    // Marca antes de enviar: se a rotina rodar duas vezes ao mesmo tempo, só uma envia.
    const claimed = await prisma.partnerVendor.updateMany({
      where: { id: vendor.id, planReminderDays: vendor.planReminderDays, planExpiresAt: vendor.planExpiresAt },
      data: { planReminderDays: day },
    });
    if (claimed.count === 0) continue;

    if (await avisarFornecedor(vendor, day, now, whatsappReady)) sent++;
  }

  return { checked: vendors.length, sent };
}
