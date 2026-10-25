import "server-only";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { emailDaMarca, emailEstaConfigurado, enviarEmail } from "@/lib/email/email";
import { urlDoApp } from "@/lib/app-url";
import { obterConfiguracaoDaPlataforma } from "@/lib/platform/settings";
import { coletarSaude } from "@/lib/platform/queries/saude";
import { mesmoConjuntoDeAlertas, selecionarAlertas } from "@/lib/platform/health";

/**
 * Alertas por e-mail da Saúde do sistema. Verificados UMA vez por dia, dentro da rotina diária "avisos"
 * (não há como checar de minuto em minuto no plano atual). Só envia se houver um endereço configurado,
 * o e-mail estiver funcionando e algo ligado estiver mesmo errado. O mesmo conjunto de alertas não se repete
 * em menos de 20 horas. Nunca lança erro: um alerta que falha não pode derrubar a rotina.
 */

const JANELA_SEM_REPETIR_EM_MS = 20 * 60 * 60 * 1000;

export type ResultadoDaRodadaDeAlertas = { sent: boolean; reason: "sent" | "no_recipient" | "email_off" | "nothing" | "repeated" | "failed"; keys: string[] };

export async function rodarAlertasDeSaude(now = new Date()): Promise<ResultadoDaRodadaDeAlertas> {
  try {
    const settings = await obterConfiguracaoDaPlataforma("healthAlerts");
    if (!settings.sendTo) return { sent: false, reason: "no_recipient", keys: [] };
    if (!emailEstaConfigurado()) return { sent: false, reason: "email_off", keys: [] };
    const snap = await coletarSaude();
    const items = selecionarAlertas(settings, {
      mpConsecutiveFailures: snap.mercadopago.consecutiveFailures,
      whatsapp: { configured: snap.whatsapp.configured, connected: snap.whatsapp.connected },
      crons: snap.crons.map((c) => ({ job: c.job, state: c.state })),
    });
    if (items.length === 0) return { sent: false, reason: "nothing", keys: [] };
    const keys = items.map((i) => i.key);

    const last = await prisma.auditLog.findFirst({ where: { action: "health.alert_sent", createdAt: { gte: new Date(now.getTime() - JANELA_SEM_REPETIR_EM_MS) } }, orderBy: { createdAt: "desc" }, select: { details: true } });
    const lastKeys = (last?.details as { keys?: unknown } | null)?.keys;
    if (Array.isArray(lastKeys) && mesmoConjuntoDeAlertas(lastKeys.map(String), keys)) return { sent: false, reason: "repeated", keys };

    const { html, text } = emailDoAlerta(items.map((i) => `${i.title}. ${i.detail}`));
    const result = await enviarEmail({ to: settings.sendTo, subject: `Aceito: ${items.length === 1 ? "1 coisa pede atenção" : `${items.length} coisas pedem atenção`}`, html, text });
    if (!result.sent) return { sent: false, reason: "failed", keys };
    await registrarAuditoria({ action: "health.alert_sent", targetType: "health", details: { keys }, actor: { id: null, name: "Sistema" } });
    return { sent: true, reason: "sent", keys };
  } catch (error) {
    console.error("[alertas] Falha ao verificar:", error instanceof Error ? error.message : error);
    return { sent: false, reason: "failed", keys: [] };
  }
}

export function emailDoAlerta(lines: string[]) {
  return emailDaMarca({
    heading: "Algo pede a sua atenção",
    preheader: lines[0]?.slice(0, 100),
    paragraphs: lines,
    cta: { label: "Abrir a Saúde do sistema", url: urlDoApp("/admin/saude") },
    footnotes: ["Os alertas são verificados uma vez por dia. Para mudar o que recebe, abra a Saúde do sistema."],
  });
}
