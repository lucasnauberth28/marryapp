import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { expirarPlanosDeFornecedor } from "@/lib/subscriptions";
import { enviarLembretesDoPlanoDoFornecedor } from "@/lib/vendor-plan-reminders";
import { recusarSeNaoForCron } from "@/lib/security/cron-auth";
import { avisarPlanoVencido } from "@/lib/notifications/cron";
import { recordCronRun } from "@/lib/platform/system-records";

/**
 * Rotina diária (Vercel Cron, ver vercel.json): fornecedores com o mês pago vencido voltam ao plano gratuito,
 * e quem vence em 7 dias ou 1 dia recebe o aviso para renovar (WhatsApp, e-mail e aviso no sino).
 * Roda às 8h de Brasília: fora do horário de silêncio dos avisos por push.
 * A Vercel envia "Authorization: Bearer <CRON_SECRET>"; sem o segredo configurado, a rota não roda.
 */
export async function GET(req: Request) {
  const rejected = recusarSeNaoForCron(req);
  if (rejected) return rejected;

  const startedAt = new Date();
  let expired = 0;
  let vendors: Awaited<ReturnType<typeof expirarPlanosDeFornecedor>>["vendors"];
  try {
    ({ count: expired, vendors } = await expirarPlanosDeFornecedor());
  } catch (error) {
    await recordCronRun({ job: "expirar-planos", startedAt, status: "FAILED", error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
  if (expired > 0) {
    revalidatePath("/fornecedor", "layout");
    revalidatePath("/fornecedores");
  }
  // O aviso no sino nunca atrapalha a expiração, que já aconteceu (notifyPlanExpired não lança erro).
  for (const vendor of vendors) {
    await avisarPlanoVencido({ vendorId: vendor.id, planName: vendor.planName, expiredAt: vendor.expiredAt });
  }
  // Um erro nos avisos não pode desfazer a expiração, que já aconteceu.
  let reminderFailure: string | null = null;
  const reminders = await enviarLembretesDoPlanoDoFornecedor().catch((error) => {
    console.error("[Cron] Falha nos avisos de vencimento:", error);
    reminderFailure = error instanceof Error ? error.message : String(error);
    return null;
  });
  // Registro para a Saúde do sistema (nunca atrapalha a rotina)
  await recordCronRun({
    job: "expirar-planos",
    startedAt,
    status: reminderFailure ? "FAILED" : "OK",
    summary: { expired, ...(reminders ? { reminders: { ...reminders } } : {}) },
    error: reminderFailure,
  });
  return NextResponse.json({ success: true, expired, reminders });
}
