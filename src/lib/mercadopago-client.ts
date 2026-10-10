"use client";

/**
 * Tokenização de cartão no navegador via SDK oficial do Mercado Pago (MercadoPago.js v2).
 * Os dados do cartão vão direto do navegador para o Mercado Pago: nosso servidor recebe
 * apenas o token de uso único, o que reduz drasticamente o escopo PCI-DSS.
 */

interface MercadoPagoInstance {
  createCardToken(data: {
    cardNumber: string;
    cardholderName: string;
    cardExpirationMonth: string;
    cardExpirationYear: string;
    securityCode: string;
    identificationType?: string;
    identificationNumber?: string;
  }): Promise<{ id: string }>;
  getPaymentMethods(params: { bin: string }): Promise<{ results: { id: string; name: string }[] }>;
}

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
  }
}

const SDK_URL = "https://sdk.mercadopago.com/js/v2";
let sdkPromise: Promise<void> | null = null;
let instance: MercadoPagoInstance | null = null;

function loadSdk(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SDK_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        sdkPromise = null;
        reject(new Error("Não foi possível carregar o Mercado Pago."));
      };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

async function getInstance(): Promise<MercadoPagoInstance> {
  // Aceita também NEXT_PUBLIC_MP_PUBLIC_KEY, o nome usado na Vercel do projeto (cada acesso precisa ser literal para o Next embutir no build).
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
  if (!publicKey) throw new Error("Pagamento com cartão indisponível no momento.");
  await loadSdk();
  if (!window.MercadoPago) throw new Error("Não foi possível carregar o Mercado Pago.");
  instance ??= new window.MercadoPago(publicKey, { locale: "pt-BR" });
  return instance;
}

export async function tokenizeCard(input: {
  cardNumber: string;
  cardholderName: string;
  cardExpiry: string; // "MM/AA" ou "MM/AAAA"
  securityCode: string;
}): Promise<{ token: string; paymentMethodId: string }> {
  const mp = await getInstance();
  const cardNumber = input.cardNumber.replace(/\D/g, "");
  const [month = "", yearRaw = ""] = input.cardExpiry.split("/").map((p) => p.trim());
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;

  const methods = await mp.getPaymentMethods({ bin: cardNumber.slice(0, 8) });
  const paymentMethodId = methods.results?.[0]?.id;
  if (!paymentMethodId) throw new Error("Bandeira do cartão não reconhecida.");

  const { id } = await mp.createCardToken({
    cardNumber,
    cardholderName: input.cardholderName.trim().toUpperCase(),
    cardExpirationMonth: month.padStart(2, "0"),
    cardExpirationYear: year,
    securityCode: input.securityCode.replace(/\D/g, ""),
  });

  return { token: id, paymentMethodId };
}
