// Estado dos filtros da lista pública. A data do casamento vai para a URL (?data=): o servidor devolve só quem está livre.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { iniciarProgressoDaNavegacao } from "@/components/feedback/navigation-progress";
import { TODAS_AS_REGIOES, VALOR_TODOS, type ChaveDeOrdenacao } from "./constantes";

export function useFiltrosDosFornecedores(dataAtiva: string, hojeIso: string) {
  const router = useRouter();
  const [data, setData] = useState(dataAtiva);
  const [trocandoData, iniciarTroca] = useTransition();
  const [categoria, setCategoria] = useState(VALOR_TODOS);
  const [regiao, setRegiao] = useState(TODAS_AS_REGIOES);
  const [busca, setBusca] = useState("");
  const [orcamento, setOrcamento] = useState("");
  const [soComCuradoria, setSoComCuradoria] = useState(false);
  const [ordenacao, setOrdenacao] = useState<ChaveDeOrdenacao>("relevance");
  // No celular, data e valor ficam recolhidos atrás de "Mais filtros".
  const [maisFiltros, setMaisFiltros] = useState(false);

  const aplicarData = (valor: string) => {
    setData(valor);
    if (valor && valor < hojeIso) return;
    iniciarProgressoDaNavegacao();
    iniciarTroca(() => {
      router.replace(valor ? `/fornecedores?data=${valor}` : "/fornecedores", { scroll: false });
    });
  };

  const limpar = () => {
    setCategoria(VALOR_TODOS);
    setRegiao(TODAS_AS_REGIOES);
    setBusca("");
    setOrcamento("");
    setSoComCuradoria(false);
    if (dataAtiva) aplicarData("");
  };

  const temFiltros = categoria !== VALOR_TODOS || regiao !== TODAS_AS_REGIOES || !!busca.trim() || !!orcamento || soComCuradoria || !!dataAtiva;
  return { data, aplicarData, trocandoData, categoria, setCategoria, regiao, setRegiao, busca, setBusca, orcamento, setOrcamento, soComCuradoria, setSoComCuradoria, ordenacao, setOrdenacao, maisFiltros, setMaisFiltros, limpar, temFiltros };
}

export type FiltrosDaTela = ReturnType<typeof useFiltrosDosFornecedores>;
