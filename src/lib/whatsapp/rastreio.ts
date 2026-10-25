import "server-only";
import { registrarEventoDeServico } from "@/lib/platform/system-records";

// Saúde do sistema: resultado de cada envio, sem telefone, texto nem mídia.
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

export async function rastreado<T extends ResultadoDoEnvio>(kind: string, run: () => Promise<T>): Promise<T> {
  const result = await run();
  const reason = result.success ? null : motivoSeguro(result.error);
  if (reason === "") return result; // serviço não configurado: aparece como "não configurado", não como falha
  if (reason === "Número sem WhatsApp") await registrarEventoDeServico({ service: "whatsapp", kind: "invalid_number", ok: true, message: reason });
  else await registrarEventoDeServico({ service: "whatsapp", kind, ok: result.success, message: reason });
  return result;
}
