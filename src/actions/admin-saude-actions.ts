"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { registrarAuditoria } from "@/lib/audit";
import { emailEstaConfigurado, enviarEmail } from "@/lib/email/email";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { obterConfiguracaoDaPlataforma, salvarConfiguracaoDaPlataforma } from "@/lib/platform/settings";
import { emailDoAlerta } from "@/lib/platform/health-alerts";
import { whatsappEstaConfigurado } from "@/lib/whatsapp/config";
import { conectarInstancia } from "@/lib/whatsapp/instancia";

import { ERROS } from "@/lib/mensagens-de-erro";
type Falha = { success: false; error: string; fieldErrors?: Record<string, string> };
type Sucesso = { success: true; message: string };

/** Quais alertas por e-mail ficam ligados e para onde vão (verificados uma vez por dia). */
export async function salvarAlertasDeSaude(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const parsed = z
      .object({
        mercadoPagoFailures: z.boolean(),
        whatsappDisconnected: z.boolean(),
        routineMissed: z.boolean(),
        sendTo: z.string().trim().toLowerCase().max(200),
      })
      .parse(input);
    if (parsed.sendTo && !z.string().email().safeParse(parsed.sendTo).success) {
      return { success: false, error: "Confira o e-mail.", fieldErrors: { sendTo: "Confira o e-mail: falta o @ ou o final do endereço." } };
    }
    const current = await obterConfiguracaoDaPlataforma("healthAlerts");
    // errorRate depende do Sentry (não integrado): fica como está, a tela não oferece
    await salvarConfiguracaoDaPlataforma("healthAlerts", { ...current, ...parsed });
    revalidatePath("/admin/saude");
    return { success: true, message: "Alertas salvos." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "saveHealthAlerts");
  }
}

/** Manda um e-mail de teste para o endereço salvo dos alertas. */
export async function testarAlertasDeSaude(): Promise<Sucesso | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const limit = await conferirLimiteDeUso({ key: `HEALTH_ALERT_TEST:${admin.userId}`, limit: 5, windowMs: 60 * 60_000 });
    if (!limit.success) return { success: false, error: "Muitos testes seguidos. Aguarde um pouco." };
    const settings = await obterConfiguracaoDaPlataforma("healthAlerts");
    if (!settings.sendTo) return { success: false, error: "Salve primeiro o e-mail que recebe os alertas." };
    if (!emailEstaConfigurado()) return { success: false, error: "O e-mail não está configurado no servidor (RESEND_API_KEY)." };
    const { html, text } = emailDoAlerta(["Este é um teste: se você recebeu esta mensagem, os alertas por e-mail estão funcionando."]);
    const result = await enviarEmail({ to: settings.sendTo, subject: "Aceito: teste dos alertas", html, text });
    await registrarAuditoria({ action: "health.alert_test", targetType: "health", details: { sent: result.sent } });
    return result.sent ? { success: true, message: "Teste enviado. Confira a caixa de entrada." } : { success: false, error: "Não foi possível enviar o teste. Confira o e-mail e a configuração." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "testHealthAlerts");
  }
}

/**
 * Gera o QR Code para reconectar o WhatsApp (mesma função da tela de WhatsApp do painel). O QR é uma credencial
 * de pareamento: só volta para quem pediu e nunca vai ao registro. Erros técnicos ficam só no log do servidor.
 */
export async function reconectarWhatsapp(): Promise<{ success: true; qrCode: string } | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    if (!whatsappEstaConfigurado()) return { success: false, error: "O WhatsApp não está configurado neste ambiente." };
    const limit = await conferirLimiteDeUso({ key: `ADMIN_WA_RECONNECT:${admin.userId}`, limit: 6, windowMs: 10 * 60_000 });
    if (!limit.success) return { success: false, error: ERROS.muitasTentativas };
    const result = await conectarInstancia();
    await registrarAuditoria({ action: "whatsapp.reconnect", targetType: "whatsapp", details: { qrGenerated: Boolean(result.success && result.qrCode) } });
    if (result.success && result.qrCode) return { success: true, qrCode: result.qrCode };
    console.error("[reconnectWhatsapp]", result.error);
    return { success: false, error: "Não deu para gerar o QR Code agora. Tente de novo em instantes." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "reconnectWhatsapp");
  }
}
