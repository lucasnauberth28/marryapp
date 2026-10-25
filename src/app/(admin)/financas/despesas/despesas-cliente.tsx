"use client";
// A tela de despesas do casal: filtros, visão agrupada ou detalhada, cadastro em três passos e exclusão com confirmação.
import { useMemo, useState } from "react";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { useEstadoSincronizado } from "@/hooks/use-synced-state";
import { agruparDespesas, filtrarPorTipo } from "./agrupar-despesas";
import { BarraDeFiltros, type FiltroDeTipo, type Visao } from "./barra-de-filtros";
import { DialogoNovaDespesa } from "./dialogo-nova-despesa";
import type { CartaoDaCarteira, ItemDeDespesa, OpcaoDeFornecedor } from "./tipos";
import { useAcoesDasDespesas } from "./use-acoes-das-despesas";
import { useCadastroDeDespesa } from "./use-cadastro-de-despesa";
import { useVisaoAgrupada } from "./use-visao-agrupada";
import { VisaoAgrupada } from "./visao-agrupada";
import { VisaoDetalhada } from "./visao-detalhada";

interface DespesasClienteProps {
  initialExpenses: ItemDeDespesa[];
  vendors: OpcaoDeFornecedor[];
  userCards?: CartaoDaCarteira[];
}

export function DespesasCliente({ initialExpenses, vendors, userCards = [] }: DespesasClienteProps) {
  const [despesas, definirDespesas] = useEstadoSincronizado<ItemDeDespesa[]>(initialExpenses);
  const [visao, setVisao] = useState<Visao>("grouped");
  const [filtro, setFiltro] = useState<FiltroDeTipo>("ALL");
  const cadastro = useCadastroDeDespesa();
  const acoes = useAcoesDasDespesas(despesas, definirDespesas);

  const doTipo = useMemo(() => filtrarPorTipo(despesas, filtro), [despesas, filtro]);
  const grupos = useMemo(() => agruparDespesas(doTipo), [doTipo]);
  const visaoAgrupada = useVisaoAgrupada(grupos);

  return (
    <div className="space-y-4">
      <BarraDeFiltros
        total={despesas.length}
        filtro={filtro}
        aoMudarFiltro={setFiltro}
        visao={visao}
        aoMudarVisao={setVisao}
        botaoDeCadastro={<DialogoNovaDespesa cadastro={cadastro} fornecedores={vendors} cartoes={userCards} />}
      />
      {visao === "grouped" ? <VisaoAgrupada estado={visaoAgrupada} acoes={acoes} /> : <VisaoDetalhada despesas={doTipo} acoes={acoes} />}
      <ModalDeConfirmacao
        isOpen={acoes.confirmacaoAberta}
        onClose={acoes.fecharConfirmacao}
        onConfirm={acoes.confirmarExclusao}
        title="Excluir despesa"
        description="Tem certeza de que deseja excluir esta despesa?"
      />
    </div>
  );
}
