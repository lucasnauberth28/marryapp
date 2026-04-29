/**
 * Evolution API Service
 *
 * Responsável por toda comunicação via WhatsApp.
 * Configure as variáveis de ambiente para ativar o serviço:
 *   EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE
 */

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;

function isConfigured() {
  return !!(EVOLUTION_URL && EVOLUTION_KEY && EVOLUTION_INSTANCE);
}

interface SendMessageOptions {
  phone: string; // Formato E.164, ex: "5511999998888"
  text: string;
}

interface SendInteractiveOptions {
  phone: string;
  title: string;
  body: string;
  buttons: { id: string; text: string }[];
}

/**
 * Envia uma mensagem de texto simples via WhatsApp.
 */
export async function sendTextMessage({ phone, text }: SendMessageOptions) {
  if (!isConfigured()) {
    console.warn("[Evolution API] Serviço não configurado. Mensagem não enviada.");
    return { success: false, error: "Evolution API não configurada." };
  }

  const response = await fetch(
    `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_KEY!,
      },
      body: JSON.stringify({
        number: phone,
        text,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("[Evolution API] Erro ao enviar mensagem:", err);
    return { success: false, error: err };
  }

  return { success: true };
}

/**
 * Envia uma mensagem com botões interativos via WhatsApp.
 * A Evolution API usa o formato de "buttons" do WhatsApp Business.
 */
export async function sendInteractiveMessage({
  phone,
  title,
  body,
  buttons,
}: SendInteractiveOptions) {
  if (!isConfigured()) {
    console.warn("[Evolution API] Serviço não configurado. Mensagem interativa não enviada.");
    return { success: false, error: "Evolution API não configurada." };
  }

  const response = await fetch(
    `${EVOLUTION_URL}/message/sendButtons/${EVOLUTION_INSTANCE}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_KEY!,
      },
      body: JSON.stringify({
        number: phone,
        title,
        description: body,
        buttons: buttons.map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.text },
        })),
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("[Evolution API] Erro ao enviar botões:", err);
    return { success: false, error: err };
  }

  return { success: true };
}

/**
 * Dispara mensagens para uma lista de convidados com rate limiting.
 * Aguarda 300ms entre cada envio para respeitar os limites da API.
 */
export async function sendBulkMessages(
  recipients: Array<{ phone: string; message: string }>,
  delayMs = 300
) {
  const results = [];

  for (const r of recipients) {
    const result = await sendTextMessage({ phone: r.phone, text: r.message });
    results.push({ phone: r.phone, ...result });
    // Rate limiting: aguarda antes do próximo envio
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return results;
}
