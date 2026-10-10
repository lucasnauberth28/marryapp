import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { expireVendorPlans } from "@/lib/subscriptions";
import { sendVendorPlanReminders } from "@/lib/vendor-plan-reminders";
import { rejectUnlessCron } from "@/lib/security/cron-auth";
import { notifyPlanExpired } from "@/lib/notifications/cron";

/**
 * Rotina diária (Vercel Cron, ver vercel.json): fornecedores com o mês pago vencido voltam ao plano gratuito,
 * e quem vence em 7 dias ou 1 dia recebe o aviso para renovar (WhatsApp, e-mail e aviso no sino).
 * Roda às 8h de Brasília: fora do horário de silêncio dos avisos por push.
 * A Vercel envia "Authorization: Bearer <CRON_SECRET>"; sem o segredo configurado, a rota não roda.
 */
export async function GET(req: Request) {
  const rejected = rejectUnlessCron(req);
  if (rejected) return rejected;

  const { count: expired, vendors } = await expireVendorPlans();
  if (expired > 0) {
    revalidatePath("/fornecedor", "layout");
    revalidatePath("/fornecedores");
  }
  // O aviso no sino nunca atrapalha a expiração, que já aconteceu (notifyPlanExpired não lança erro).
  for (const vendor of vendors) {
    await notifyPlanExpired({ vendorId: vendor.id, planName: vendor.planName, expiredAt: vendor.expiredAt });
  }
  // Um erro nos avisos não pode desfazer a expiração, que já aconteceu.
  const reminders = await sendVendorPlanReminders().catch((error) => {
    console.error("[Cron] Falha nos avisos de vencimento:", error);
    return null;
  });
  return NextResponse.json({ success: true, expired, reminders });
}
