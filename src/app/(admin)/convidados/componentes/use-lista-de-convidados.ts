// A lista na tela: filtro por resposta, grupo, busca e quantos aparecem por vez.
import { useMemo, useState } from "react";
import { CATEGORIAS_DE_CONVIDADO, TAMANHO_DA_PAGINA, type FiltroDaLista, type LinhaDoConvidado } from "./tipos";
import { filtrarConvidados } from "./utilitarios";

export function useListaDeConvidados(convidados: LinhaDoConvidado[], filtroInicial: FiltroDaLista) {
  const [filtro, setFiltro] = useState<FiltroDaLista>(filtroInicial);
  const [grupo, setGrupo] = useState("");
  const [busca, setBusca] = useState("");
  const [visiveis, setVisiveis] = useState(TAMANHO_DA_PAGINA);

  const contagens = useMemo(() => {
    const c = { all: convidados.length, CONFIRMED: 0, PENDING: 0, DECLINED: 0 };
    for (const g of convidados) c[g.rsvpStatus] += 1;
    return c;
  }, [convidados]);

  const grupos = useMemo(() => {
    const set = new Set<string>(CATEGORIAS_DE_CONVIDADO);
    for (const g of convidados) if (g.category) set.add(g.category);
    return [...set];
  }, [convidados]);

  const filtrados = useMemo(() => filtrarConvidados(convidados, filtro, grupo, busca), [convidados, filtro, grupo, busca]);

  /** Muda um critério e volta ao começo da lista. */
  const voltarAoInicio = <T,>(definir: (valor: T) => void) => (valor: T) => {
    definir(valor);
    setVisiveis(TAMANHO_DA_PAGINA);
  };

  return {
    filtro, grupo, busca, contagens, grupos, filtrados,
    mostrados: filtrados.slice(0, visiveis),
    mudarFiltro: voltarAoInicio(setFiltro),
    mudarGrupo: voltarAoInicio(setGrupo),
    mudarBusca: voltarAoInicio(setBusca),
    carregarMais: () => setVisiveis((v) => v + TAMANHO_DA_PAGINA),
  };
}

export type ListaDeConvidados = ReturnType<typeof useListaDeConvidados>;
