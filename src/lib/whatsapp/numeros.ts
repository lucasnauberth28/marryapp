import "server-only";
import { somenteDigitos } from "../formatacao/telefone.ts";
import { INSTANCIA_DA_EVOLUTION, URL_DA_EVOLUTION, cabecalhosDaEvolution } from "./config";

function formatarNumeroDeTelefone(phone: string): string {
  const clean = somenteDigitos(phone);
  if (clean.startsWith("55") && (clean.length === 12 || clean.length === 13)) return clean;
  if (clean.length === 10 || clean.length === 11) return `55${clean}`;
  return clean;
}

/** Verifica se um número existe no WhatsApp e obtém o número canônico verificado. */
export async function resolverJidDoWhatsapp(phone: string): Promise<{ exists: boolean; number: string }> {
  const cleanNumber = formatarNumeroDeTelefone(phone);
  try {
    const res = await fetch(`${URL_DA_EVOLUTION}/chat/whatsappNumbers/${INSTANCIA_DA_EVOLUTION}`, {
      method: "POST",
      headers: cabecalhosDaEvolution(true),
      body: JSON.stringify({ numbers: [cleanNumber] }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        if (!data[0].exists) return { exists: false, number: cleanNumber };
        return { exists: true, number: data[0].number || data[0].jid?.split("@")[0] || cleanNumber };
      }
    }
  } catch (e) {
    console.error("[Evolution API] Erro ao consultar whatsappNumbers:", e);
  }

  return { exists: true, number: cleanNumber };
}
