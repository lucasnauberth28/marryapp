// Os momentos da história e as dicas aos convidados: listas, formulários de novo item e remoção.
import { useState, type TransitionStartFunction } from "react";
import { toast } from "sonner";
import { criarDicaDoCasamento, criarItemDaHistoria, excluirDicaDoCasamento, excluirItemDaHistoria } from "@/actions/site-builder-actions";
import { NOVA_DICA, NOVO_MOMENTO, type Dica, type ItemDaHistoria, type ItemParaExcluir } from "./tipos";

export function useHistoria(inicial: ItemDaHistoria[], iniciar: TransitionStartFunction) {
  const [itens, setItens] = useState(inicial);
  const [novo, setNovo] = useState(NOVO_MOMENTO);
  const [adicionando, setAdicionando] = useState(false);

  const adicionar = () => {
    if (!novo.title.trim() || !novo.description.trim()) return void toast.error("Informem o título e o que aconteceu neste momento.");
    setAdicionando(true);
    iniciar(async () => {
      const resposta = await criarItemDaHistoria({ ...novo, position: itens.length });
      setAdicionando(false);
      if (!resposta.success || !resposta.item) return void toast.error(resposta.error || "Não deu para adicionar o momento. Tente de novo.");
      setItens((anteriores) => [...anteriores, resposta.item as ItemDaHistoria]);
      setNovo(NOVO_MOMENTO);
      toast.success("Momento adicionado.");
    });
  };

  const remover = async (id: string) => {
    const resposta = await excluirItemDaHistoria(id);
    if (resposta.success) setItens((anteriores) => anteriores.filter((i) => i.id !== id));
    return resposta;
  };

  return { itens, novo, setNovo, adicionando, adicionar, remover };
}

export function useDicas(inicial: Dica[], iniciar: TransitionStartFunction) {
  const [itens, setItens] = useState(inicial);
  const [nova, setNova] = useState(NOVA_DICA);
  const [adicionando, setAdicionando] = useState(false);

  const adicionar = () => {
    if (!nova.title.trim()) return void toast.error("Informem o nome do lugar.");
    setAdicionando(true);
    iniciar(async () => {
      const resposta = await criarDicaDoCasamento({ ...nova, position: itens.length });
      setAdicionando(false);
      if (!resposta.success || !resposta.tip) return void toast.error(resposta.error || "Não deu para adicionar a dica. Tente de novo.");
      setItens((anteriores) => [...anteriores, resposta.tip as Dica]);
      setNova({ ...NOVA_DICA, category: nova.category });
      toast.success("Dica adicionada.");
    });
  };

  const remover = async (id: string) => {
    const resposta = await excluirDicaDoCasamento(id);
    if (resposta.success) setItens((anteriores) => anteriores.filter((t) => t.id !== id));
    return resposta;
  };

  return { itens, nova, setNova, adicionando, adicionar, remover };
}

type Remocao = (id: string) => Promise<{ success: boolean; error?: string }>;

/** Pede a confirmação antes de remover um momento ou uma dica. */
export function useExclusaoDeItem(removerMomento: Remocao, removerDica: Remocao, iniciar: TransitionStartFunction) {
  const [pendente, setPendente] = useState<ItemParaExcluir | null>(null);

  const confirmar = () => {
    if (!pendente) return;
    const { tipo, id } = pendente;
    iniciar(async () => {
      const resposta = await (tipo === "story" ? removerMomento(id) : removerDica(id));
      if (resposta.success) toast.success(tipo === "story" ? "Momento removido." : "Dica removida.");
      else toast.error(resposta.error || "Não deu para remover agora. Tente de novo.");
      setPendente(null);
    });
  };

  return { pendente, setPendente, confirmar };
}
