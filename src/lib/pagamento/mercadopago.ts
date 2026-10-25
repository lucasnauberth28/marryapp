import "server-only";
import { MercadoPagoConfig, Payment } from "mercadopago";

// Inicializa o SDK do Mercado Pago
const tokenDeAcessoDoMercadoPago = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || "";

const configuracaoDoMercadoPago = new MercadoPagoConfig({
  accessToken: tokenDeAcessoDoMercadoPago,
});

export const pagamentoDoMercadoPago = new Payment(configuracaoDoMercadoPago);

export function mercadoPagoEstaConfigurado() {
  return tokenDeAcessoDoMercadoPago.length > 0;
}

/** Cartão só funciona com o Mercado Pago configurado (token no servidor e chave pública no navegador). */
export function pagamentoPorCartaoEstaDisponivel() {
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
  return mercadoPagoEstaConfigurado() && Boolean(publicKey);
}

/**
 * Calcula o valor final com o repasse das taxas do cartão.
 * Fórmula: ValorFinal = (ValorPresente + TaxaFixa) / (1 - TaxaPercentual)
 *
 * @param amountInCents Valor original em centavos
 * @returns { finalAmount: number, fee: number } Valores em centavos
 */
export function calcularTarifaDoCartao(amountInCents: number) {
  // Taxas padrão Mercado Pago (4.99% + R$ 0,00 fixo para recebimento na hora)
  const feePercent = parseFloat(process.env.MP_FEE_PERCENT || "4.99") / 100;
  const feeFixed = Math.round(parseFloat(process.env.MP_FEE_FIXED || "0") * 100);

  const finalAmount = Math.round((amountInCents + feeFixed) / (1 - feePercent));
  const fee = finalAmount - amountInCents;

  return {
    finalAmount,
    fee,
  };
}

export { valorPagoConfere, verificarAssinaturaDoMercadoPago } from "@/lib/security/webhook-signature";
