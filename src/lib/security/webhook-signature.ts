// Funções puras (sem dependências do Next) para validar notificações de pagamento.
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Confere se o valor pago no gateway (em reais) corresponde ao valor esperado (em centavos).
 */
export function paidAmountMatches(transactionAmountInReais: number | undefined, expectedCents: number) {
  if (typeof transactionAmountInReais !== "number") return false;
  return Math.round(transactionAmountInReais * 100) === expectedCents;
}

/**
 * Valida a assinatura (x-signature) das notificações do Mercado Pago.
 * Documentação: o manifest é "id:{data.id};request-id:{x-request-id};ts:{ts};" assinado com HMAC-SHA256.
 */
export function verifyMercadoPagoSignature(params: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
  secret: string;
}): boolean {
  const { signatureHeader, requestId, dataId, secret } = params;
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [k, ...v] = part.split("=");
      return [k?.trim(), v.join("=").trim()];
    })
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  let manifest = "";
  if (dataId) manifest += `id:${/^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;

  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(v1, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
