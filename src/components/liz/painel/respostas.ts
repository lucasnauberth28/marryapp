import type { ResultadoDaAjuda } from "@/lib/liz/help-search";
import { assuntoDoArtigo, type assuntosPara } from "@/lib/liz/topics";
import type { Etapa, RespostaPronta } from "./tipos";

interface Entrada {
  stage: Etapa;
  topics: ReturnType<typeof assuntosPara>;
  hitById: Map<string, ResultadoDaAjuda>;
  pickTip: () => void;
  pickTopic: (id: string) => void;
  pickArticle: (id: string) => void;
  backToRoot: () => void;
}

/** Respostas prontas do passo atual da conversa. */
export function respostasDaEtapa({ stage, topics, hitById, pickTip, pickTopic, pickArticle, backToRoot }: Entrada): RespostaPronta[] {
  const others = { key: "outros", label: "Outro assunto", onPick: backToRoot };
  const artigo = (h: ResultadoDaAjuda) => ({ key: h.article.id, label: h.article.title, onPick: () => pickArticle(h.article.id) });
  switch (stage.kind) {
    case "root":
      return [{ key: "dica", label: "O que fazer agora?", onPick: pickTip, primary: true }, ...topics.map((t) => ({ key: t.topic.id, label: t.topic.label, onPick: () => pickTopic(t.topic.id) }))];
    case "topic": {
      const t = topics.find((x) => x.topic.id === stage.topicId);
      return [...(t?.hits ?? []).map(artigo), others];
    }
    case "article": {
      const topic = assuntoDoArtigo(stage.articleId);
      const more = topic && topics.some((x) => x.topic.id === topic.id && x.hits.length > 1);
      return [...(more ? [{ key: "mais", label: `Mais dúvidas de ${topic.label.toLowerCase()}`, onPick: () => pickTopic(topic.id) }] : []), others];
    }
    case "hits":
      return [...stage.articleIds.map((id) => hitById.get(id)).filter((h): h is ResultadoDaAjuda => !!h).map(artigo), others];
    case "tip":
      return [others];
  }
}
