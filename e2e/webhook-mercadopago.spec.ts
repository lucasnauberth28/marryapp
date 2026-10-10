import { test, expect } from "@playwright/test";

// O webhook é público: sem assinatura válida do Mercado Pago ele tem que recusar (401).
// A verificação só existe quando o servidor tem MERCADOPAGO_WEBHOOK_SECRET; rode o teste com a mesma
// variável no ambiente (o CI já faz isso).
test.describe("webhook do Mercado Pago", () => {
  test.skip(!process.env.MERCADOPAGO_WEBHOOK_SECRET, "defina MERCADOPAGO_WEBHOOK_SECRET (a mesma do servidor)");

  test("recusa chamada sem x-signature", async ({ request }) => {
    const res = await request.post("/api/webhooks/mercadopago", {
      data: { type: "payment", data: { id: "123456789" } },
    });
    expect(res.status()).toBe(401);
  });

  test("recusa assinatura forjada", async ({ request }) => {
    const res = await request.post("/api/webhooks/mercadopago?data.id=123456789", {
      headers: {
        "x-signature": `ts=1700000000,v1=${"0".repeat(64)}`,
        "x-request-id": "e2e",
      },
      data: { type: "payment", data: { id: "123456789" } },
    });
    expect(res.status()).toBe(401);
  });
});
