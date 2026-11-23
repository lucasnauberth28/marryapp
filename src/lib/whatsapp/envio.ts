import "server-only";
import { INSTANCIA_DA_EVOLUTION, URL_DA_EVOLUTION, cabecalhosDaEvolution, estaConfigurado } from "./config";
import { resolverJidDoWhatsapp } from "./numeros";

type ResultadoDoEnvio = { success: boolean; error?: string; data?: unknown };

const mensagemDoErro = (error: unknown, padrao: string) => (error instanceof Error ? error.message : undefined) || padrao;

/** Confere se o serviço está ligado e o número tem WhatsApp; devolve o número canônico ou o resultado de falha. */
async function prepararEnvio(phone: string, oQue: string): Promise<{ number: string } | { falha: ResultadoDoEnvio }> {
  if (!estaConfigurado()) {
    console.warn(`[Evolution API] Serviço não configurado. ${oQue} não enviada.`);
    return { falha: { success: false, error: "Evolution API não configurada." } };
  }
  const { exists, number } = await resolverJidDoWhatsapp(phone);
  if (!exists) return { falha: { success: false, error: `O número ${phone} não possui conta ativa no WhatsApp.` } };
  return { number };
}

/** POST na Evolution com o corpo em JSON; falha de HTTP vira `HTTP <status>: <corpo>`. */
async function postarNaEvolution(caminho: string, corpo: unknown, rotulos: { erro: string; excecao: string }, erroPadrao: string): Promise<ResultadoDoEnvio> {
  try {
    const response = await fetch(`${URL_DA_EVOLUTION}${caminho}/${INSTANCIA_DA_EVOLUTION}`, { method: "POST", headers: cabecalhosDaEvolution(true), body: JSON.stringify(corpo) });
    if (!response.ok) {
      const err = await response.text();
      console.error(`[Evolution API] Erro ao enviar ${rotulos.erro}:`, response.status, err);
      return { success: false, error: `HTTP ${response.status}: ${err}` };
    }
    return { success: true, data: await response.json() };
  } catch (error) {
    console.error(`[Evolution API] Exceção ao enviar ${rotulos.excecao}:`, error);
    return { success: false, error: mensagemDoErro(error, erroPadrao) };
  }
}

interface OpcoesDeEnvioDeMensagem {
  phone: string; // Formato E.164, ex: "5511999998888"
  text: string;
}

/** Envia uma mensagem de texto simples via WhatsApp. */
export async function enviarMensagemDeTextoBruta({ phone, text }: OpcoesDeEnvioDeMensagem): Promise<ResultadoDoEnvio> {
  const pronto = await prepararEnvio(phone, "Mensagem");
  if ("falha" in pronto) return pronto.falha;
  return postarNaEvolution("/message/sendText", { number: pronto.number, text, delay: 1200, linkPreview: true }, { erro: "mensagem", excecao: "texto" }, "Falha ao enviar mensagem de texto.");
}
