"use server";

import { revalidatePath, updateTag } from "next/cache";
import { logAudit } from "@/lib/audit";
import { platformAdminFailure, requirePlatformAdmin } from "@/lib/security/platform-admin";
import { getPlatformSetting, savePlatformSetting } from "@/lib/platform/settings";
import { parseEmailSender, parseMaintenance, refundPolicyInput } from "@/lib/platform/config-core";
import { MAINTENANCE_TAG } from "@/lib/platform/maintenance";
import { EMAIL_SENDER_TAG } from "@/lib/platform/email-sender";

import { ERROS } from "@/lib/mensagens-de-erro";
/**
 * Configurações da plataforma. Cada função começa pelo guard da administração e grava pelo helper
 * savePlatformSetting (valida com zod e registra antes e depois no AuditLog).
 */

type Fail = { success: false; error: string; fieldErrors?: Record<string, string> };
type Ok = { success: true; message: string };

/**
 * Liga ou desliga o modo de manutenção. Vale em até 30 segundos no máximo (a leitura tem cache curto; o cache é
 * limpo na hora aqui). Aviso a casais e convidados, painel do casal só para leitura; o /admin e os webhooks seguem normais.
 */
export async function saveMaintenance(input: unknown): Promise<Ok | Fail> {
  try {
    await requirePlatformAdmin();
    const parsed = parseMaintenance(input);
    if (!parsed.ok) return { success: false, error: ERROS.camposInvalidos, fieldErrors: parsed.errors };
    const before = await getPlatformSetting("maintenance");
    await savePlatformSetting("maintenance", parsed.value, parsed.value.enabled ? "Manutenção ligada" : "Manutenção desligada");
    if (before.enabled !== parsed.value.enabled) {
      await logAudit({ action: parsed.value.enabled ? "maintenance.enable" : "maintenance.disable", targetType: "platform_setting", targetId: "maintenance", details: { backAt: parsed.value.backAt } });
    }
    updateTag(MAINTENANCE_TAG);
    revalidatePath("/admin/configuracoes");
    return { success: true, message: parsed.value.enabled ? "Modo de manutenção ligado. Casais e convidados já veem o aviso." : "Modo de manutenção desligado." };
  } catch (error) {
    return platformAdminFailure(error, "saveMaintenance");
  }
}

/** Remetente dos e-mails. Vazio = o remetente do servidor (EMAIL_FROM). Não dá para validar o domínio na Resend daqui. */
export async function saveEmailSender(input: unknown): Promise<Ok | Fail> {
  try {
    await requirePlatformAdmin();
    const parsed = parseEmailSender(input);
    if (!parsed.ok) return { success: false, error: ERROS.camposInvalidos, fieldErrors: parsed.errors };
    await savePlatformSetting("emailSender", parsed.value);
    updateTag(EMAIL_SENDER_TAG);
    revalidatePath("/admin/configuracoes");
    return { success: true, message: parsed.value.fromEmail ? "Remetente salvo. Vale para os próximos e-mails." : "Voltamos ao remetente do servidor." };
  } catch (error) {
    return platformAdminFailure(error, "saveEmailSender");
  }
}

/** Política de reembolso: prazo e texto. Quem decide é sempre a administração (a decisão automática não existe). */
export async function saveRefundPolicy(input: unknown): Promise<Ok | Fail> {
  try {
    await requirePlatformAdmin();
    const parsed = refundPolicyInput.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
      return { success: false, error: ERROS.camposInvalidos, fieldErrors };
    }
    await savePlatformSetting("refundPolicy", { days: Number(parsed.data.days), decidedBy: "ADMIN", text: parsed.data.text });
    revalidatePath("/admin/configuracoes");
    revalidatePath("/admin/planos");
    return { success: true, message: "Política de reembolso salva." };
  } catch (error) {
    return platformAdminFailure(error, "saveRefundPolicy");
  }
}

