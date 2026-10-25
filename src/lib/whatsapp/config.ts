// Evolution API (WhatsApp): configuração. Sem valores padrão: URL, chave e instância precisam vir do ambiente.
//   EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE
import "server-only";

export const URL_DA_EVOLUTION = (process.env.EVOLUTION_API_URL || "").trim().replace(/\/+$/, "");
export const CHAVE_DA_EVOLUTION = (process.env.EVOLUTION_API_KEY || "").trim();
export const INSTANCIA_DA_EVOLUTION = (process.env.EVOLUTION_INSTANCE || "").trim();

export function estaConfigurado() {
  return !!(URL_DA_EVOLUTION && CHAVE_DA_EVOLUTION && INSTANCIA_DA_EVOLUTION);
}

/** Para quem só quer saber se há WhatsApp configurado antes de montar a mensagem. */
export function whatsappEstaConfigurado() {
  return estaConfigurado();
}

/** Cabeçalhos das chamadas: a chave da API e, nas que levam corpo, o tipo JSON. */
export function cabecalhosDaEvolution(comCorpo = false): Record<string, string> {
  return comCorpo ? { "Content-Type": "application/json", apikey: CHAVE_DA_EVOLUTION } : { apikey: CHAVE_DA_EVOLUTION };
}
