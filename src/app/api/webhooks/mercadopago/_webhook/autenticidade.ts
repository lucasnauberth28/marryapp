import { NextResponse } from "next/server";
import { verificarAssinaturaDoMercadoPago } from "@/lib/mercadopago";

/**
 * Autenticidade da notificação (x-signature). O status real é sempre reconsultado na API do MP.
 * Devolve a resposta 401 quando a assinatura não confere; null quando pode seguir.
 */
export function conferirAssinaturaDoAviso(req: Request, url: URL, paymentId: string): NextResponse | null {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (secret) {
    const valid = verificarAssinaturaDoMercadoPago({
      signatureHeader: req.headers.get("x-signature"),
      requestId: req.headers.get("x-request-id"),
      dataId: url.searchParams.get("data.id") ?? (paymentId || null),
      secret,
    });
    if (!valid) {
      console.warn("[Webhook MP] Assinatura inválida, notificação descartada.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("[Webhook MP] MERCADOPAGO_WEBHOOK_SECRET não configurado: assinatura não verificada.");
  }
  return null;
}
