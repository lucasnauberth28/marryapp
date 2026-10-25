"use client";
// O cronograma do dia do casamento: horários que os convidados e os fornecedores veem.
import { Download, Plus } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { estiloDoBotao } from "@/components/painel/styles";
import { ListaDeHorarios, SemHorarios } from "./componentes/lista-de-horarios";
import { ModaisDoCronograma } from "./componentes/modais-do-cronograma";
import type { EventoDaLinhaDoTempo } from "./componentes/tipos";
import { useCronograma } from "./componentes/use-cronograma";

export function LinhaDoTempoCliente({ initialEvents, coupleNames, dateLabel }: { initialEvents: EventoDaLinhaDoTempo[]; coupleNames: string; dateLabel: string | null }) {
  const c = useCronograma(initialEvents, coupleNames);
  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDaPagina
        eyebrow={dateLabel ?? "Dia do casamento"}
        title="Cronograma do dia"
        description="Os convidados veem estes horários na página do dia do evento, no site de vocês."
        actions={
          <>
            <button type="button" onClick={c.exportarPdf} disabled={c.events.length === 0} className={estiloDoBotao.secondary}>
              <Download className="size-4" aria-hidden="true" />
              PDF para fornecedores
            </button>
            <button type="button" onClick={() => c.abrirFormulario(null)} className={estiloDoBotao.primary}>
              <Plus className="size-4" aria-hidden="true" />
              Novo horário
            </button>
          </>
        }
      />
      {c.ordenados.length === 0 ? <SemHorarios aoAdicionar={() => c.abrirFormulario(null)} /> : <ListaDeHorarios eventos={c.ordenados} aoEditar={c.abrirFormulario} aoExcluir={c.setParaExcluir} />}
      <ModaisDoCronograma
        formularioAberto={c.formularioAberto}
        aoFecharFormulario={c.fecharFormulario}
        editando={c.editando}
        quantidade={c.events.length}
        aoSalvar={c.atualizarTela}
        aoPedirExclusao={(e) => {
          c.fecharFormulario();
          c.setParaExcluir(e);
        }}
        paraExcluir={c.paraExcluir}
        aoCancelarExclusao={() => c.setParaExcluir(null)}
        aoExcluir={(e) => void c.excluir(e)}
      />
    </div>
  );
}
