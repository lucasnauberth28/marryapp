"use server";

import { revalidatePath, updateTag } from "next/cache";
import { registrarAuditoria } from "@/lib/audit";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { obterConfiguracaoDaPlataforma, salvarConfiguracaoDaPlataforma } from "@/lib/platform/settings";
import { interpretarRemetenteDeEmail, interpretarManutencao, entradaDaPoliticaDeReembolso } from "@/lib/platform/config-core";
import { ETIQUETA_DA_MANUTENCAO } from "@/lib/platform/maintenance";
import { ETIQUETA_DO_REMETENTE_DE_EMAIL } from "@/lib/platform/email-sender";

import { ERROS } from "@/lib/mensagens-de-erro";
/**
 * Configurações da plataforma. Cada função começa pelo guard da administração e grava pelo helper
 * savePlatformSetting (valida com zod e registra antes e depois no AuditLog).
 */

type Falha = { success: false; error: string; fieldErrors?: Record<string, string> };
type Sucesso = { success: true; message: string };

/**
 * Liga ou desliga o modo de manutenção. Vale em até 30 segundos no máximo (a leitura tem cache curto; o cache é
 * limpo na hora aqui). Aviso a casais e convidados, painel do casal só para leitura; o /admin e os webhooks seguem normais.
 */
export async function salvarManutencao(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const parsed = interpretarManutencao(input);
    if (!parsed.ok) return { success: false, error: ERROS.camposInvalidos, fieldErrors: parsed.errors };
    const before = await obterConfiguracaoDaPlataforma("maintenance");
    await salvarConfiguracaoDaPlataforma("maintenance", parsed.value, parsed.value.enabled ? "Manutenção ligada" : "Manutenção desligada");
    if (before.enabled !== parsed.value.enabled) {
      await registrarAuditoria({ action: parsed.value.enabled ? "maintenance.enable" : "maintenance.disable", targetType: "platform_setting", targetId: "maintenance", details: { backAt: parsed.value.backAt } });
    }
    updateTag(ETIQUETA_DA_MANUTENCAO);
    revalidatePath("/admin/configuracoes");
    return { success: true, message: parsed.value.enabled ? "Modo de manutenção ligado. Casais e convidados já veem o aviso." : "Modo de manutenção desligado." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "saveMaintenance");
  }
}

/** Remetente dos e-mails. Vazio = o remetente do servidor (EMAIL_FROM). Não dá para validar o domínio na Resend daqui. */
export async function salvarRemetenteDeEmail(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const parsed = interpretarRemetenteDeEmail(input);
    if (!parsed.ok) return { success: false, error: ERROS.camposInvalidos, fieldErrors: parsed.errors };
    await salvarConfiguracaoDaPlataforma("emailSender", parsed.value);
    updateTag(ETIQUETA_DO_REMETENTE_DE_EMAIL);
    revalidatePath("/admin/configuracoes");
    return { success: true, message: parsed.value.fromEmail ? "Remetente salvo. Vale para os próximos e-mails." : "Voltamos ao remetente do servidor." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "saveEmailSender");
  }
}

/** Política de reembolso: prazo e texto. Quem decide é sempre a administração (a decisão automática não existe). */
export async function salvarPoliticaDeReembolso(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const parsed = entradaDaPoliticaDeReembolso.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
      return { success: false, error: ERROS.camposInvalidos, fieldErrors };
    }
    await salvarConfiguracaoDaPlataforma("refundPolicy", { days: Number(parsed.data.days), decidedBy: "ADMIN", text: parsed.data.text });
    revalidatePath("/admin/configuracoes");
    revalidatePath("/admin/planos");
    return { success: true, message: "Política de reembolso salva." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "saveRefundPolicy");
  }
}

