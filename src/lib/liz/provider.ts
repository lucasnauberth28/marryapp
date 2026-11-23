import "server-only";
import { obterConfiguracaoDaPlataforma } from "@/lib/platform/settings";
import { chatDaLizEstaAtivo, respondedoraDoGuiaDeAjuda, type RespondedoraDaLiz } from "./answerer";
import { responderComOGemini } from "./conversa-com-ia";

/**
 * Provedor de IA da Liz: o Gemini. Existe só com GEMINI_API_KEY no servidor (a chave vem do painel da Vercel, nunca do código
 * nem do casal). Se o modelo não puder responder (limite, ajuste do casal, erro da API), a pergunta cai no guia de ajuda.
 * Só o casamento da sessão conta no consumo e nenhum dado de convidado vai ao modelo.
 */
export function obterProvedorDaLiz(): RespondedoraDaLiz | null {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) return null;
  return {
    async answer(question, context) {
      return (await responderComOGemini(question, context, chave)) ?? respondedoraDoGuiaDeAjuda.answer(question, context);
    },
  };
}

/** Lê o interruptor geral e confere se há provedor: falso sem a chave do Gemini ou com a Liz desligada/pausada. */
export async function lerSeOChatDaLizEstaAtivo(): Promise<boolean> {
  const master = await obterConfiguracaoDaPlataforma("madrinha.master");
  return chatDaLizEstaAtivo(master, obterProvedorDaLiz());
}
