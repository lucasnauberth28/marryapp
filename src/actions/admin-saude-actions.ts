"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { platformAdminFailure, requirePlatformAdmin } from "@/lib/security/platform-admin";
import { getPlatformSetting, savePlatformSetting } from "@/lib/platform/settings";
import { alertEmail } from "@/lib/platform/health-alerts";
import { connectInstance, isWhatsappConfigured } from "@/lib/evolution";

import { ERROS } from "@/lib/mensagens-de-erro";
type Fail = { success: false; error: string; fieldErrors?: Record<string, string> };
type Ok = { success: true; message: string };

/** Quais alertas por e-mail ficam ligados e para onde vão (verificados uma vez por dia). */
export async function saveHealthAlerts(input: unknown): Promise<Ok | Fail> {
  try {
    await requirePlatformAdmin();
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
    const current = await getPlatformSetting("healthAlerts");
    // errorRate depende do Sentry (não integrado): fica como está, a tela não oferece
    await savePlatformSetting("healthAlerts", { ...current, ...parsed });
    revalidatePath("/admin/saude");
    return { success: true, message: "Alertas salvos." };
  } catch (error) {
    return platformAdminFailure(error, "saveHealthAlerts");
  }
}

/** Manda um e-mail de teste para o endereço salvo dos alertas. */
export async function testHealthAlerts(): Promise<Ok | Fail> {
  try {
    const admin = await requirePlatformAdmin();
    const limit = await checkRateLimit({ key: `HEALTH_ALERT_TEST:${admin.userId}`, limit: 5, windowMs: 60 * 60_000 });
    if (!limit.success) return { success: false, error: "Muitos testes seguidos. Aguarde um pouco." };
    const settings = await getPlatformSetting("healthAlerts");
    if (!settings.sendTo) return { success: false, error: "Salve primeiro o e-mail que recebe os alertas." };
    if (!isEmailConfigured()) return { success: false, error: "O e-mail não está configurado no servidor (RESEND_API_KEY)." };
    const { html, text } = alertEmail(["Este é um teste: se você recebeu esta mensagem, os alertas por e-mail estão funcionando."]);
    const result = await sendEmail({ to: settings.sendTo, subject: "Aceito: teste dos alertas", html, text });
    await logAudit({ action: "health.alert_test", targetType: "health", details: { sent: result.sent } });
    return result.sent ? { success: true, message: "Teste enviado. Confira a caixa de entrada." } : { success: false, error: "Não foi possível enviar o teste. Confira o e-mail e a configuração." };
  } catch (error) {
    return platformAdminFailure(error, "testHealthAlerts");
  }
}

/**
 * Gera o QR Code para reconectar o WhatsApp (mesma função da tela de WhatsApp do painel). O QR é uma credencial
 * de pareamento: só volta para quem pediu e nunca vai ao registro. Erros técnicos ficam só no log do servidor.
 */
export async function reconnectWhatsapp(): Promise<{ success: true; qrCode: string } | Fail> {
  try {
    const admin = await requirePlatformAdmin();
    if (!isWhatsappConfigured()) return { success: false, error: "O WhatsApp não está configurado neste ambiente." };
    const limit = await checkRateLimit({ key: `ADMIN_WA_RECONNECT:${admin.userId}`, limit: 6, windowMs: 10 * 60_000 });
    if (!limit.success) return { success: false, error: ERROS.muitasTentativas };
    const result = await connectInstance();
    await logAudit({ action: "whatsapp.reconnect", targetType: "whatsapp", details: { qrGenerated: Boolean(result.success && result.qrCode) } });
    if (result.success && result.qrCode) return { success: true, qrCode: result.qrCode };
    console.error("[reconnectWhatsapp]", result.error);
    return { success: false, error: "Não deu para gerar o QR Code agora. Tente de novo em instantes." };
  } catch (error) {
    return platformAdminFailure(error, "reconnectWhatsapp");
  }
}
