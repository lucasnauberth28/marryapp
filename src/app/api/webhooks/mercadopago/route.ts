import { NextResponse } from "next/server";
import { pagamentoDoMercadoPago } from "@/lib/mercadopago";
import { interpretarReferenciaDaAssinatura } from "@/lib/subscription-period";
import { conferirAssinaturaDoAviso } from "./_webhook/autenticidade";
import { tratarPagamentoDeAssinatura } from "./_webhook/assinatura-de-plano";
import { tratarPagamentoDePresente } from "./_webhook/presente";
import { registrarResultadoDoAviso } from "./_webhook/registro";

async function tratarAviso(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const paymentId = String(url.searchParams.get("data.id") ?? body.data?.id ?? body.id ?? "");

    const recusada = conferirAssinaturaDoAviso(req, url, paymentId);
    if (recusada) return recusada;

    // Só processa notificações do tipo 'payment'
    const type = body.type ?? body.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
    if (type !== "payment") return NextResponse.json({ received: true });
    if (!paymentId || !/^\d+$/.test(paymentId)) return NextResponse.json({ error: "No payment ID found" }, { status: 400 });

    // Busca os dados atualizados diretamente no Mercado Pago (fonte da verdade)
    const mpResponse = await pagamentoDoMercadoPago.get({ id: paymentId });
    const status = mpResponse.status;
    const internalTxId = mpResponse.external_reference;

    // Assinaturas de plano têm referência própria ("assinatura:<id>"); o resto é presente.
    const subscriptionId = interpretarReferenciaDaAssinatura(internalTxId);
    if (subscriptionId) return tratarPagamentoDeAssinatura(subscriptionId, paymentId, status, mpResponse.transaction_amount);
    if (!internalTxId) return NextResponse.json({ received: true, ignored: "no external reference" });
    return tratarPagamentoDePresente(internalTxId, paymentId, status, mpResponse.transaction_amount);
  } catch (error) {
    console.error("[Webhook Mercado Pago Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** Entrada do webhook: o processamento está em `_webhook`; aqui só se responde e se registra o resultado. */
export async function POST(req: Request) {
  const response = await tratarAviso(req);
  await registrarResultadoDoAviso(req, response);
  return response;
}
