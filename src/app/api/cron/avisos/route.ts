import { NextResponse } from "next/server";
import { rejectUnlessCron } from "@/lib/security/cron-auth";
import { sendExpenseReminders } from "@/lib/notifications/cron";
import { prunePlatformRecords, recordCronRun } from "@/lib/platform/system-records";
import { runHealthAlerts } from "@/lib/platform/health-alerts";
import { sendDomainRenewalReminders } from "@/lib/domain-renewal-reminders";

/**
 * Rotina diária (Vercel Cron, ver vercel.json): avisa o casal das despesas que vencem em até 3 dias
 * ou que venceram na última semana. Roda às 8h de Brasília, fora do horário de silêncio.
 * Autenticada pelo CRON_SECRET; sem ele a rota não roda.
 */
export async function GET(req: Request) {
  const rejected = rejectUnlessCron(req);
  if (rejected) return rejected;

  const startedAt = new Date();
  let failure: string | null = null;
  const expenses = await sendExpenseReminders().catch((error) => {
    failure = error instanceof Error ? error.message : String(error);
    console.error("[Cron avisos] Falha nos avisos de despesas:", failure);
    return null;
  });
  // Aviso de renovação do domínio próprio (60 e 30 dias antes); um erro aqui não derruba a rotina
  const domains = await sendDomainRenewalReminders().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Cron avisos] Falha nos avisos de domínio:", message);
    failure = failure ?? message;
    return null;
  });
  // Registro para a Saúde do sistema (nunca atrapalha a rotina)
  await recordCronRun({
    job: "avisos",
    startedAt,
    status: failure ? "FAILED" : "OK",
    summary: { ...(expenses ? { expenses: { ...expenses } } : {}), ...(domains ? { domainRenewals: { ...domains } } : {}) },
    error: failure,
  });
  await prunePlatformRecords();
  // Alertas por e-mail da Saúde do sistema (uma verificação por dia; nunca lança erro)
  const alerts = await runHealthAlerts();
  return NextResponse.json({ success: true, expenses, domainRenewals: domains, alerts: alerts.reason });
}
