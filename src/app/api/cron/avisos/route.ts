import { NextResponse } from "next/server";
import { rejectUnlessCron } from "@/lib/security/cron-auth";
import { sendExpenseReminders } from "@/lib/notifications/cron";
import { prunePlatformRecords, recordCronRun } from "@/lib/platform/system-records";

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
  // Registro para a Saúde do sistema (nunca atrapalha a rotina)
  await recordCronRun({
    job: "avisos",
    startedAt,
    status: failure ? "FAILED" : "OK",
    summary: expenses ? { expenses: { ...expenses } } : undefined,
    error: failure,
  });
  await prunePlatformRecords();
  return NextResponse.json({ success: true, expenses });
}
