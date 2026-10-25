import { perguntarALiz } from "@/actions/liz-actions";
import { respondedoraDoGuiaDeAjuda, type RespondedoraDaLiz, type ContextoDaPerguntaALiz } from "@/lib/liz/answerer";
import { mensagemDaPessoa, textoDaLiz, type CorpoDaMensagem, type Etapa } from "./tipos";

/** Respondedor que passa a pergunta ao servidor (provedor de IA). Só é usado quando a administração liga a Liz. */
const respondedoraDoServidor: RespondedoraDaLiz = {
  async answer(question, context) {
    const result = await perguntarALiz({ question, pathname: context.pathname });
    if (!result.success) throw new Error(result.error);
    return result.answer;
  },
};

export interface RespostaDaConversa {
  mensagens: CorpoDaMensagem[];
  etapa: Etapa;
}

/** Responde a dúvida escrita: com IA (se ligada) ou procurando no guia. Nunca lança: a falha vira uma fala da Liz. */
export async function responderDuvida(pergunta: string, context: ContextoDaPerguntaALiz, chatEnabled: boolean): Promise<RespostaDaConversa> {
  const dela = mensagemDaPessoa(pergunta);
  try {
    const answerer = chatEnabled ? respondedoraDoServidor : respondedoraDoGuiaDeAjuda;
    const answer = await answerer.answer(pergunta, context);
    const hits = answer.kind === "articles" ? answer.hits : answer.sources;
    const ids = hits.map((h) => h.article.id);
    const etapa: Etapa = ids.length ? { kind: "hits", articleIds: ids } : { kind: "root" };
    if (answer.kind === "text") return { mensagens: [dela, textoDaLiz(answer.text)], etapa };
    if (ids.length === 0) {
      return { mensagens: [dela, textoDaLiz("Ainda não sei responder isso. Escolham um assunto aqui embaixo e eu mostro as dúvidas mais comuns.")], etapa };
    }
    return { mensagens: [dela, textoDaLiz(ids.length === 1 ? "Achei esta dúvida no guia. É essa?" : "Achei estas dúvidas no guia. Qual é a de vocês?")], etapa };
  } catch {
    return { mensagens: [dela, textoDaLiz("Não deu para responder agora. Tentem de novo em instantes ou escolham um assunto.")], etapa: { kind: "root" } };
  }
}
