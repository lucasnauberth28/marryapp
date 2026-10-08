import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { expireVendorPlans } from "@/lib/subscriptions";

/**
 * Rotina diária (Vercel Cron, ver vercel.json): fornecedores com o mês pago vencido voltam ao plano gratuito.
 * A Vercel envia "Authorization: Bearer <CRON_SECRET>"; sem o segredo configurado, a rota não roda.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET não configurado" }, { status: 503 });
  }
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(req.headers.get("authorization") ?? "");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expired = await expireVendorPlans();
  if (expired > 0) {
    revalidatePath("/fornecedor", "layout");
    revalidatePath("/fornecedores");
  }
  return NextResponse.json({ success: true, expired });
}
