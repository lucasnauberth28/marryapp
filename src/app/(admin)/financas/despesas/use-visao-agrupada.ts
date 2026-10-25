// Estado da visão agrupada (busca, página e grupos abertos). Fica na tela, e não no componente da visão, para a
// busca não se perder quando a pessoa troca para a visão detalhada e volta.
import { useMemo, useState } from "react";
import { filtrarGruposPorBusca } from "./agrupar-despesas";
import { TAMANHO_DA_PAGINA_DOS_GRUPOS, type DespesaAgrupada } from "./tipos";

export function useVisaoAgrupada(grupos: DespesaAgrupada[]) {
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});

  const filtrados = useMemo(() => filtrarGruposPorBusca(grupos, busca), [grupos, busca]);
  const totalDePaginas = Math.ceil(filtrados.length / TAMANHO_DA_PAGINA_DOS_GRUPOS) || 1;
  const paginaSegura = Math.min(Math.max(1, pagina), totalDePaginas);
  const daPagina = useMemo(() => {
    const inicio = (paginaSegura - 1) * TAMANHO_DA_PAGINA_DOS_GRUPOS;
    return filtrados.slice(inicio, inicio + TAMANHO_DA_PAGINA_DOS_GRUPOS);
  }, [filtrados, paginaSegura]);

  const buscar = (texto: string) => {
    setBusca(texto);
    setPagina(1);
  };
  const alternarGrupo = (id: string) => setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));

  return { busca, buscar, setPagina, paginaSegura, totalDePaginas, totalDeItens: filtrados.length, daPagina, expandidos, alternarGrupo };
}

export type EstadoDaVisaoAgrupada = ReturnType<typeof useVisaoAgrupada>;
