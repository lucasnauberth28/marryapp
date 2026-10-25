/**
 * Evolution API Service
 *
 * Responsável por toda comunicação via WhatsApp.
 * Configure as variáveis de ambiente para ativar o serviço:
 *   EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE
 */

import "server-only";
import { recordServiceEvent } from "@/lib/platform/system-records";

import { somenteDigitos } from "./formatacao/telefone.ts";
// Sem valores padrão: URL, chave e instância precisam vir do ambiente.
const URL_DA_EVOLUTION = (process.env.EVOLUTION_API_URL || "").trim().replace(/\/+$/, "");
const CHAVE_DA_EVOLUTION = (process.env.EVOLUTION_API_KEY || "").trim();
const INSTANCIA_DA_EVOLUTION = (process.env.EVOLUTION_INSTANCE || "").trim();

function estaConfigurado() {
  return !!(URL_DA_EVOLUTION && CHAVE_DA_EVOLUTION && INSTANCIA_DA_EVOLUTION);
}

/** Para quem só quer saber se há WhatsApp configurado antes de montar a mensagem. */
export function whatsappEstaConfigurado() {
  return estaConfigurado();
}

/**
 * O QR de pareamento é uma credencial: nunca enviá-lo a serviços externos para gerar imagem.
 * Retorna a data URL da Evolution, ou o código bruto (renderizado como QR no navegador).
 */
function formatarQrCode(rawQr?: string | null): string | null {
  if (!rawQr) return null;
  return rawQr;
}

function formatarNumeroDeTelefone(phone: string): string {
  const clean = somenteDigitos(phone);
  if (clean.startsWith("55") && (clean.length === 12 || clean.length === 13)) {
    return clean;
  }
  if (clean.length === 10 || clean.length === 11) {
    return `55${clean}`;
  }
  return clean;
}

interface OpcoesDeEnvioDeMensagem {
  phone: string; // Formato E.164, ex: "5511999998888"
  text: string;
}
/**
 * Verifica se um número existe no WhatsApp e obtém o número canônico verificado.
 */
async function resolverJidDoWhatsapp(phone: string): Promise<{ exists: boolean; number: string }> {
  const cleanNumber = formatarNumeroDeTelefone(phone);
  try {
    const res = await fetch(`${URL_DA_EVOLUTION}/chat/whatsappNumbers/${INSTANCIA_DA_EVOLUTION}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: CHAVE_DA_EVOLUTION!,
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
async function enviarMensagemDeTextoBruta({ phone, text }: OpcoesDeEnvioDeMensagem) {
  if (!estaConfigurado()) {
    console.warn("[Evolution API] Serviço não configurado. Mensagem não enviada.");
    return { success: false, error: "Evolution API não configurada." };
  }

  const { exists, number: cleanNumber } = await resolverJidDoWhatsapp(phone);

  if (!exists) {
    return { success: false, error: `O número ${phone} não possui conta ativa no WhatsApp.` };
  }

  try {
    const response = await fetch(
      `${URL_DA_EVOLUTION}/message/sendText/${INSTANCIA_DA_EVOLUTION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: CHAVE_DA_EVOLUTION!,
        },
        body: JSON.stringify({
          number: cleanNumber,
          text,
          delay: 1200,
          linkPreview: true,
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
  } catch (error) {
    console.error("[Evolution API] Exceção ao enviar texto:", error);
    return { success: false, error: (error instanceof Error ? error.message : undefined) || "Falha ao enviar mensagem de texto." };
  }
}
/**
 * Busca o status de conexão da instância do Evolution API.
 */
export async function obterEstadoDaConexao() {
  if (!estaConfigurado()) {
    return { state: "DISCONNECTED", message: "Serviço não configurado." };
  }

  try {
    const response = await fetch(`${URL_DA_EVOLUTION}/instance/connectionState/${INSTANCIA_DA_EVOLUTION}`, {
      headers: {
        apikey: CHAVE_DA_EVOLUTION!,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return { state: "DISCONNECTED", message: "Não foi possível verificar o status." };
    }

    const data = await response.json();
    return { state: data.instance?.state || "DISCONNECTED" };
  } catch {
    return { state: "DISCONNECTED", message: "Erro ao comunicar com Evolution API." };
  }
}

/**
 * Cria a instância caso ela não exista no servidor da Evolution API.
 */
async function criarInstancia() {
  if (!estaConfigurado()) return null;
  try {
    const response = await fetch(`${URL_DA_EVOLUTION}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: CHAVE_DA_EVOLUTION!,
      },
      body: JSON.stringify({
        instanceName: INSTANCIA_DA_EVOLUTION,
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

async function desconectarInstancia() {
  if (!estaConfigurado()) return null;
  try {
    const response = await fetch(`${URL_DA_EVOLUTION}/instance/logout/${INSTANCIA_DA_EVOLUTION}`, {
      method: "DELETE",
      headers: {
        apikey: CHAVE_DA_EVOLUTION!,
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
export async function conectarInstancia() {
  if (!estaConfigurado()) {
    return { success: false, error: `Serviço não configurado: URL=${URL_DA_EVOLUTION}, KEY=${!!CHAVE_DA_EVOLUTION}, INSTANCE=${INSTANCIA_DA_EVOLUTION}` };
  }

  try {
    const fetchUrl = `${URL_DA_EVOLUTION}/instance/connect/${INSTANCIA_DA_EVOLUTION}`;
    let response = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        apikey: CHAVE_DA_EVOLUTION!,
      },
      cache: 'no-store'
    });

    if (response.status === 404) {
      await criarInstancia();
      await new Promise(r => setTimeout(r, 2000));
      response = await fetch(fetchUrl, {
        method: "GET",
        headers: { apikey: CHAVE_DA_EVOLUTION! },
        cache: 'no-store'
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `HTTP ${response.status} de ${fetchUrl}: ${errText.substring(0, 150)}` };
    }

    const data = await response.json();
    const rawQr = data?.base64 || data?.qrcode?.base64 || data?.qrcode?.code || data?.code;
    const formatted = formatarQrCode(rawQr);
    if (formatted) {
      return { success: true, qrCode: formatted };
    }

    // Se a resposta veio OK mas sem QR Code ({ count: 0 }), desloga a instância para forçar novo QR Code
    if (data?.qrcode?.count === 0 || data?.count === 0 || !rawQr) {
      await desconectarInstancia();
      await new Promise(r => setTimeout(r, 2500));
      
      const retryRes = await fetch(fetchUrl, {
        method: "GET",
        headers: { apikey: CHAVE_DA_EVOLUTION! },
        cache: 'no-store'
      });

      if (retryRes.ok) {
        const retryData = await retryRes.json();
        const retryQr = retryData?.base64 || retryData?.qrcode?.base64 || retryData?.qrcode?.code || retryData?.code;
        const retryFormatted = formatarQrCode(retryQr);
        if (retryFormatted) {
          return { success: true, qrCode: retryFormatted };
        }
        return { success: false, error: `Sem QR pós-logout: ${JSON.stringify(retryData).substring(0, 150)}` };
      }
    }

    return { success: false, error: `Sem QR Code no payload: ${JSON.stringify(data).substring(0, 150)}` };
  } catch (error) {
    return { success: false, error: `Exceção em connectInstance: ${(error instanceof Error ? error.message : undefined) || String(error)}` };
  }
}

interface OpcoesDeEnvioDeMidia {
  phone: string;
  mediaUrl: string;
  mediaType?: string | null; 
  caption?: string;
  fileName?: string;
}

/**
 * Envia imagem, PDF, áudio ou outro arquivo via WhatsApp.
 */
async function enviarMensagemDeMidiaBruta({ 
  phone, 
  mediaUrl, 
  mediaType, 
  caption, 
  fileName 
}: OpcoesDeEnvioDeMidia) {
  if (!estaConfigurado()) {
    console.warn("[Evolution API] Serviço não configurado. Mídia não enviada.");
    return { success: false, error: "Evolution API não configurada." };
  }

  const { exists, number: cleanNumber } = await resolverJidDoWhatsapp(phone);

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
      `${URL_DA_EVOLUTION}/message/sendMedia/${INSTANCIA_DA_EVOLUTION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: CHAVE_DA_EVOLUTION!,
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
  } catch (error) {
    console.error("[Evolution API] Exceção ao enviar mídia:", error);
    return { success: false, error: (error instanceof Error ? error.message : undefined) || "Erro de conexão ao enviar mídia." };
  }
}


// ---------- Saúde do sistema: resultado de cada envio, sem telefone, texto nem mídia ----------

type ResultadoDoEnvio = { success: boolean; error?: string };

/** Motivo curto e seguro da falha (a mensagem original pode conter número de telefone ou corpo da resposta). */
function motivoSeguro(error: string | undefined): string {
  if (!error) return "Falha no envio";
  const http = error.match(/^HTTP (\d{3})/);
  if (http) return `A Evolution API respondeu ${http[1]}`;
  if (/n[uú]mero .*n[aã]o possui conta/i.test(error)) return "Número sem WhatsApp";
  if (/n[aã]o configurada/i.test(error)) return "";
  return "Falha de conexão com a Evolution API";
}

async function rastreado<T extends ResultadoDoEnvio>(kind: string, run: () => Promise<T>): Promise<T> {
  const result = await run();
  const reason = result.success ? null : motivoSeguro(result.error);
  if (reason === "") return result; // serviço não configurado: aparece como "não configurado", não como falha
  if (reason === "Número sem WhatsApp") await recordServiceEvent({ service: "whatsapp", kind: "invalid_number", ok: true, message: reason });
  else await recordServiceEvent({ service: "whatsapp", kind, ok: result.success, message: reason });
  return result;
}

export const enviarMensagemDeTexto = (options: Parameters<typeof enviarMensagemDeTextoBruta>[0]) => rastreado("send", () => enviarMensagemDeTextoBruta(options));
const enviarMensagemDeMidia = (options: Parameters<typeof enviarMensagemDeMidiaBruta>[0]) => rastreado("send", () => enviarMensagemDeMidiaBruta(options));

/**
 * Dispara mensagens para uma lista de convidados com rate limiting anti-ban.
 * Suporta mensagens de texto simples e mensagens com mídia (imagens, documentos, áudios).
 */
export async function enviarMensagensEmLote(
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
      result = await enviarMensagemDeMidia({ 
        phone: r.phone, 
        mediaUrl: r.mediaUrl.trim(), 
        mediaType: r.mediaType || "image", 
        caption: r.message 
      });
    } else {
      result = await enviarMensagemDeTexto({ phone: r.phone, text: r.message });
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
