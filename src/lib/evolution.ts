/**
 * Evolution API Service
 *
 * Responsável por toda comunicação via WhatsApp.
 * Configure as variáveis de ambiente para ativar o serviço:
 *   EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE
 */

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || "https://marryapp-whatsapp.onrender.com";
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || "marryapp123";
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "marryapp";

function isConfigured() {
  return !!(EVOLUTION_URL && EVOLUTION_KEY && EVOLUTION_INSTANCE);
}

function formatQrCode(rawQr?: string | null): string | null {
  if (!rawQr) return null;
  if (rawQr.startsWith("data:image")) return rawQr;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(rawQr)}`;
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
 * Busca o status de conexão da instância do Evolution API.
 */
export async function getConnectionState() {
  if (!isConfigured()) {
    return { state: "DISCONNECTED", message: "Serviço não configurado." };
  }

  try {
    const response = await fetch(`${EVOLUTION_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`, {
      headers: {
        apikey: EVOLUTION_KEY!,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return { state: "DISCONNECTED", message: "Não foi possível verificar o status." };
    }

    const data = await response.json();
    return { state: data.instance?.state || "DISCONNECTED" };
  } catch (error) {
    return { state: "DISCONNECTED", message: "Erro ao comunicar com Evolution API." };
  }
}

/**
 * Cria a instância caso ela não exista no servidor da Evolution API.
 */
export async function createInstance() {
  if (!isConfigured()) return null;
  try {
    const response = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_KEY!,
      },
      body: JSON.stringify({
        instanceName: EVOLUTION_INSTANCE,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
      cache: "no-store",
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[Evolution API] Erro ao criar instância:", err);
    return null;
  }
}

export async function logoutInstance() {
  if (!isConfigured()) return null;
  try {
    const response = await fetch(`${EVOLUTION_URL}/instance/logout/${EVOLUTION_INSTANCE}`, {
      method: "DELETE",
      headers: {
        apikey: EVOLUTION_KEY!,
      },
      cache: "no-store",
    });
    return await response.json();
  } catch (err) {
    console.error("[Evolution API] Erro ao deslogar instância:", err);
    return null;
  }
}

/**
 * Tenta conectar a instância e retorna o QR Code se estiver desconectado.
 * Se a instância não existir, cria-a automaticamente.
 */
export async function connectInstance() {
  if (!isConfigured()) {
    return { success: false, error: "Serviço não configurado." };
  }

  try {
    let response = await fetch(`${EVOLUTION_URL}/instance/connect/${EVOLUTION_INSTANCE}`, {
      method: "GET",
      headers: {
        apikey: EVOLUTION_KEY!,
      },
      cache: 'no-store'
    });

    if (response.status === 404) {
      await createInstance();
      await new Promise(r => setTimeout(r, 2000));
      response = await fetch(`${EVOLUTION_URL}/instance/connect/${EVOLUTION_INSTANCE}`, {
        method: "GET",
        headers: {
          apikey: EVOLUTION_KEY!,
        },
        cache: 'no-store'
      });
    }

    if (response.ok) {
      const data = await response.json();
      const rawQr = data?.base64 || data?.qrcode?.base64 || data?.qrcode?.code || data?.code;
      const formatted = formatQrCode(rawQr);
      if (formatted) {
        return { success: true, qrCode: formatted };
      }

      // Se a resposta veio OK mas o QR Code veio zerado ({ count: 0 }), desloga a instância para forçar novo QR Code
      if (data?.qrcode?.count === 0 || data?.count === 0) {
        await logoutInstance();
        await new Promise(r => setTimeout(r, 1500));
        
        const retryRes = await fetch(`${EVOLUTION_URL}/instance/connect/${EVOLUTION_INSTANCE}`, {
          method: "GET",
          headers: {
            apikey: EVOLUTION_KEY!,
          },
          cache: 'no-store'
        });

        if (retryRes.ok) {
          const retryData = await retryRes.json();
          const retryQr = retryData?.base64 || retryData?.qrcode?.base64 || retryData?.qrcode?.code || retryData?.code;
          const retryFormatted = formatQrCode(retryQr);
          if (retryFormatted) {
            return { success: true, qrCode: retryFormatted };
          }
        }
      }
    }

    // Tenta deslogar para renovar o socket se nenhuma tentativa retornou QR Code válido
    await logoutInstance();
    await new Promise(r => setTimeout(r, 1500));
    const retryRes = await fetch(`${EVOLUTION_URL}/instance/connect/${EVOLUTION_INSTANCE}`, {
      method: "GET",
      headers: {
        apikey: EVOLUTION_KEY!,
      },
      cache: 'no-store'
    });

    if (retryRes.ok) {
      const retryData = await retryRes.json();
      const retryQr = retryData?.base64 || retryData?.qrcode?.base64 || retryData?.qrcode?.code || retryData?.code;
      const finalFormatted = formatQrCode(retryQr);
      if (finalFormatted) return { success: true, qrCode: finalFormatted };
    }

    return { success: false, error: "Não foi possível obter o QR Code. Tente clicar em Reconectar em alguns instantes." };
  } catch (error) {
    return { success: false, error: "Erro ao comunicar com a Evolution API." };
  }
}

interface SendMediaOptions {
  phone: string;
  mediaUrl: string;
  mediaType: string; 
  caption?: string;
  fileName?: string;
}

/**
 * Envia imagem, PDF, áudio ou outro arquivo via WhatsApp.
 */
export async function sendMediaMessage({ 
  phone, 
  mediaUrl, 
  mediaType, 
  caption, 
  fileName 
}: SendMediaOptions) {
  if (!isConfigured()) {
    console.warn("[Evolution API] Serviço não configurado. Mídia não enviada.");
    return { success: false, error: "Evolution API não configurada." };
  }

  const response = await fetch(
    `${EVOLUTION_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_KEY!,
      },
      body: JSON.stringify({
        number: phone,
        mediatype: mediaType,
        media: mediaUrl,
        fileName: fileName || `arquivo`,
        caption: caption || "",
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("[Evolution API] Erro ao enviar mídia:", err);
    return { success: false, error: err };
  }

  return { success: true };
}

/**
 * Dispara mensagens para uma lista de convidados com rate limiting.
 * Suporta mensagens de texto puro OU mensagens com mídia.
 */
export async function sendBulkMessages(
  recipients: Array<{ 
    phone: string; 
    message: string; 
    mediaUrl?: string | null; 
    mediaType?: string | null; 
  }>,
  baseDelayMs = 2000
) {
  const results = [];

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    let result;
    
    if (r.mediaUrl && r.mediaType) {
      result = await sendMediaMessage({ 
        phone: r.phone, 
        mediaUrl: r.mediaUrl, 
        mediaType: r.mediaType, 
        caption: r.message 
      });
    } else {
      result = await sendTextMessage({ phone: r.phone, text: r.message });
    }

    results.push({ phone: r.phone, ...result });

    // Anti-ban delay randômico
    if (i < recipients.length - 1) {
      const randomDelay = baseDelayMs + Math.floor(Math.random() * 3000); // 2 a 5 segundos
      await new Promise((resolve) => setTimeout(resolve, randomDelay));
    }
  }

  return results;
}
