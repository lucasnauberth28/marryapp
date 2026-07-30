/**
 * Evolution API Service
 *
 * Responsável por toda comunicação via WhatsApp.
 * Configure as variáveis de ambiente para ativar o serviço:
 *   EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE
 */

let rawUrl = process.env.EVOLUTION_API_URL || "https://marryapp-whatsapp.onrender.com";
if (rawUrl.includes("railway.app")) {
  rawUrl = "https://marryapp-whatsapp.onrender.com";
}
const EVOLUTION_URL = rawUrl.trim().replace(/\/+$/, "");
const EVOLUTION_KEY = (process.env.EVOLUTION_API_KEY || "marryapp123").trim();
const EVOLUTION_INSTANCE = (process.env.EVOLUTION_INSTANCE || "marryapp").trim();

function isConfigured() {
  return !!(EVOLUTION_URL && EVOLUTION_KEY && EVOLUTION_INSTANCE);
}

function formatQrCode(rawQr?: string | null): string | null {
  if (!rawQr) return null;
  if (rawQr.startsWith("data:image")) return rawQr;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(rawQr)}`;
}

function formatPhoneNumber(phone: string): string {
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("55") && (clean.length === 12 || clean.length === 13)) {
    return clean;
  }
  if (clean.length === 10 || clean.length === 11) {
    return `55${clean}`;
  }
  return clean;
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
 * Verifica se um número existe no WhatsApp e obtém o número canônico verificado.
 */
export async function resolveWhatsappJid(phone: string): Promise<{ exists: boolean; number: string }> {
  const cleanNumber = formatPhoneNumber(phone);
  try {
    const res = await fetch(`${EVOLUTION_URL}/chat/whatsappNumbers/${EVOLUTION_INSTANCE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_KEY!,
      },
      body: JSON.stringify({
        numbers: [cleanNumber],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        if (data[0].exists) {
          const resolvedNum = data[0].number || data[0].jid?.split("@")[0] || cleanNumber;
          return { exists: true, number: resolvedNum };
        } else {
          return { exists: false, number: cleanNumber };
        }
      }
    }
  } catch (e) {
    console.error("[Evolution API] Erro ao consultar whatsappNumbers:", e);
  }

  return { exists: true, number: cleanNumber };
}

/**
 * Envia uma mensagem de texto simples via WhatsApp.
 */
export async function sendTextMessage({ phone, text }: SendMessageOptions) {
  if (!isConfigured()) {
    console.warn("[Evolution API] Serviço não configurado. Mensagem não enviada.");
    return { success: false, error: "Evolution API não configurada." };
  }

  const { exists, number: cleanNumber } = await resolveWhatsappJid(phone);

  if (!exists) {
    return { success: false, error: `O número ${phone} não possui conta ativa no WhatsApp.` };
  }

  try {
    const response = await fetch(
      `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_KEY!,
        },
        body: JSON.stringify({
          number: cleanNumber,
          text,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("[Evolution API] Erro ao enviar mensagem:", response.status, err);
      return { success: false, error: `HTTP ${response.status}: ${err}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("[Evolution API] Exceção ao enviar texto:", error);
    return { success: false, error: error?.message || "Falha ao enviar mensagem de texto." };
  }
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

  const cleanNumber = formatPhoneNumber(phone);

  const formattedButtons = buttons.map((b) => ({
    type: "reply",
    displayText: b.text,
    id: b.id,
    reply: {
      id: b.id,
      title: b.text,
    },
  }));

  try {
    const response = await fetch(
      `${EVOLUTION_URL}/message/sendButtons/${EVOLUTION_INSTANCE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_KEY!,
        },
        body: JSON.stringify({
          number: cleanNumber,
          title: title || "Casamento Lucas & Giovanna",
          description: body,
          buttons: formattedButtons,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("[Evolution API] Erro ao enviar botões:", response.status, err);
      return { success: false, error: `HTTP ${response.status}: ${err}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("[Evolution API] Exceção ao enviar botões:", error);
    return { success: false, error: error?.message || "Falha ao enviar mensagem com botões." };
  }
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
    return { success: false, error: `Serviço não configurado: URL=${EVOLUTION_URL}, KEY=${!!EVOLUTION_KEY}, INSTANCE=${EVOLUTION_INSTANCE}` };
  }

  try {
    const fetchUrl = `${EVOLUTION_URL}/instance/connect/${EVOLUTION_INSTANCE}`;
    let response = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        apikey: EVOLUTION_KEY!,
      },
      cache: 'no-store'
    });

    if (response.status === 404) {
      await createInstance();
      await new Promise(r => setTimeout(r, 2000));
      response = await fetch(fetchUrl, {
        method: "GET",
        headers: { apikey: EVOLUTION_KEY! },
        cache: 'no-store'
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `HTTP ${response.status} de ${fetchUrl}: ${errText.substring(0, 150)}` };
    }

    const data = await response.json();
    const rawQr = data?.base64 || data?.qrcode?.base64 || data?.qrcode?.code || data?.code;
    const formatted = formatQrCode(rawQr);
    if (formatted) {
      return { success: true, qrCode: formatted };
    }

    // Se a resposta veio OK mas sem QR Code ({ count: 0 }), desloga a instância para forçar novo QR Code
    if (data?.qrcode?.count === 0 || data?.count === 0 || !rawQr) {
      await logoutInstance();
      await new Promise(r => setTimeout(r, 2500));
      
      const retryRes = await fetch(fetchUrl, {
        method: "GET",
        headers: { apikey: EVOLUTION_KEY! },
        cache: 'no-store'
      });

      if (retryRes.ok) {
        const retryData = await retryRes.json();
        const retryQr = retryData?.base64 || retryData?.qrcode?.base64 || retryData?.qrcode?.code || retryData?.code;
        const retryFormatted = formatQrCode(retryQr);
        if (retryFormatted) {
          return { success: true, qrCode: retryFormatted };
        }
        return { success: false, error: `Sem QR pós-logout: ${JSON.stringify(retryData).substring(0, 150)}` };
      }
    }

    return { success: false, error: `Sem QR Code no payload: ${JSON.stringify(data).substring(0, 150)}` };
  } catch (error: any) {
    return { success: false, error: `Exceção em connectInstance: ${error?.message || String(error)}` };
  }
}

interface SendMediaOptions {
  phone: string;
  mediaUrl: string;
  mediaType?: string | null; 
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

  const { exists, number: cleanNumber } = await resolveWhatsappJid(phone);

  if (!exists) {
    return { success: false, error: `O número ${phone} não possui conta ativa no WhatsApp.` };
  }

  // Normaliza o mediatype para os valores aceitos pela Evolution API v2: "image" | "video" | "document" | "audio"
  let mediatype = "image";
  if (mediaType) {
    const lower = mediaType.toLowerCase();
    if (lower.includes("video")) mediatype = "video";
    else if (lower.includes("audio")) mediatype = "audio";
    else if (lower.includes("pdf") || lower.includes("doc") || lower.includes("document")) mediatype = "document";
    else mediatype = "image";
  }

  const ext = mediatype === "image" ? "png" : mediatype === "document" ? "pdf" : "file";
  const defaultFileName = fileName || `arquivo.${ext}`;

  try {
    const response = await fetch(
      `${EVOLUTION_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_KEY!,
        },
        body: JSON.stringify({
          number: cleanNumber,
          mediatype: mediatype,
          media: mediaUrl,
          fileName: defaultFileName,
          caption: caption || "",
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("[Evolution API] Erro ao enviar mídia:", response.status, err);
      return { success: false, error: `HTTP ${response.status}: ${err}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("[Evolution API] Exceção ao enviar mídia:", error);
    return { success: false, error: error?.message || "Erro de conexão ao enviar mídia." };
  }
}

/**
 * Dispara mensagens para uma lista de convidados com rate limiting anti-ban.
 * Suporta mensagens de texto simples e mensagens com mídia (imagens, documentos, áudios).
 */
export async function sendBulkMessages(
  recipients: Array<{ 
    phone: string; 
    message: string; 
    mediaUrl?: string | null; 
    mediaType?: string | null; 
  }>,
  baseDelayMs = 1500
) {
  const results = [];

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    let result;
    
    // Se houver mediaUrl válida, envia mensagem com mídia e legenda
    if (r.mediaUrl && r.mediaUrl.trim() !== "") {
      result = await sendMediaMessage({ 
        phone: r.phone, 
        mediaUrl: r.mediaUrl.trim(), 
        mediaType: r.mediaType || "image", 
        caption: r.message 
      });
    } else {
      result = await sendTextMessage({ phone: r.phone, text: r.message });
    }

    results.push({ phone: r.phone, ...result });

    // Delay randômico anti-ban entre mensagens (1.5 a 3.5 segundos)
    if (i < recipients.length - 1) {
      const randomDelay = baseDelayMs + Math.floor(Math.random() * 2000);
      await new Promise((resolve) => setTimeout(resolve, randomDelay));
    }
  }

  return results;
}
