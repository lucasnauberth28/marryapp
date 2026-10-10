import { NextResponse } from "next/server";
import { rejectUnlessCron } from "@/lib/security/cron-auth";
import { sendExpenseReminders } from "@/lib/notifications/cron";

/**
 * Rotina diária (Vercel Cron, ver vercel.json): avisa o casal das despesas que vencem em até 3 dias
 * ou que venceram na última semana. Roda às 8h de Brasília, fora do horário de silêncio.
 * Autenticada pelo CRON_SECRET; sem ele a rota não roda.
 */
export async function GET(req: Request) {
  const rejected = rejectUnlessCron(req);
  if (rejected) return rejected;

  const expenses = await sendExpenseReminders().catch((error) => {
    console.error("[Cron avisos] Falha nos avisos de despesas:", error instanceof Error ? error.message : error);
    return null;
  });
  return NextResponse.json({ success: true, expenses });
}
