import "server-only";
import { enviarMensagemDeMidiaBruta, enviarMensagemDeTextoBruta } from "./envio";
import { rastreado } from "./rastreio";

export const enviarMensagemDeTexto = (options: Parameters<typeof enviarMensagemDeTextoBruta>[0]) => rastreado("send", () => enviarMensagemDeTextoBruta(options));
const enviarMensagemDeMidia = (options: Parameters<typeof enviarMensagemDeMidiaBruta>[0]) => rastreado("send", () => enviarMensagemDeMidiaBruta(options));

interface Destinatario {
  phone: string;
  message: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
}

/** Com mídia válida, envia a mídia com a mensagem como legenda; sem ela, só o texto. */
function enviarParaUm(r: Destinatario) {
  if (r.mediaUrl && r.mediaUrl.trim() !== "") {
    return enviarMensagemDeMidia({ phone: r.phone, mediaUrl: r.mediaUrl.trim(), mediaType: r.mediaType || "image", caption: r.message });
  }
  return enviarMensagemDeTexto({ phone: r.phone, text: r.message });
}

/**
 * Dispara mensagens para uma lista de convidados com rate limiting anti-ban.
 * Suporta mensagens de texto simples e mensagens com mídia (imagens, documentos, áudios).
 */
export async function enviarMensagensEmLote(recipients: Destinatario[], baseDelayMs = 1500) {
  const results = [];

  for (let i = 0; i < recipients.length; i++) {
    const result = await enviarParaUm(recipients[i]);
    results.push({ phone: recipients[i].phone, ...result });

    // Delay randômico anti-ban entre mensagens (1.5 a 3.5 segundos)
    if (i < recipients.length - 1) {
      const randomDelay = baseDelayMs + Math.floor(Math.random() * 2000);
      await new Promise((resolve) => setTimeout(resolve, randomDelay));
    }
  }

  return results;
}
