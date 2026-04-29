import { MercadoPagoConfig, Payment } from "mercadopago";

// Inicializa o SDK do Mercado Pago
const mpAccessToken = process.env.MP_ACCESS_TOKEN || "";

export const mpConfig = new MercadoPagoConfig({
  accessToken: mpAccessToken,
});

export const mpPayment = new Payment(mpConfig);

/**
 * Calcula o valor final com o repasse das taxas do cartão.
 * Fórmula: ValorFinal = (ValorPresente + TaxaFixa) / (1 - TaxaPercentual)
 * 
 * @param amountInCents Valor original em centavos
 * @returns { finalAmount: number, fee: number } Valores em centavos
 */
export function calculateCardFee(amountInCents: number) {
  // Taxas padrão Mercado Pago (4.99% + R$ 0,00 fixo para recebimento na hora)
  const feePercent = parseFloat(process.env.MP_FEE_PERCENT || "4.99") / 100;
  const feeFixed = Math.round(parseFloat(process.env.MP_FEE_FIXED || "0") * 100);

  // Aplica a fórmula
  const finalAmount = Math.round((amountInCents + feeFixed) / (1 - feePercent));
  const fee = finalAmount - amountInCents;

  return {
    finalAmount,
    fee,
  };
}
