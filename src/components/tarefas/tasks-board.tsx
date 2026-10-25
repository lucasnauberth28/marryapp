"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import type { ItemDoQuadro } from "@/types/kanban";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { estiloDoBotao } from "@/components/painel/styles";
import { ModalDaTarefa } from "./task-form-modal";
import { FiltrosDeTarefas, SemTarefas } from "./quadro/filtros-e-vazio";
import { ListaDeTarefas } from "./quadro/lista-de-tarefas";
import { agruparTarefas, tarefaEstaConcluida, tarefasAtrasadas, type FiltroDeTarefas } from "./quadro/prazos";
import { useTarefas } from "./quadro/use-tarefas";

export type { FiltroDeTarefas } from "./quadro/prazos";

interface PropriedadesDoQuadroDeTarefas {
  initialTasks: ItemDoQuadro[];
  /** Hoje em São Paulo (AAAA-MM-DD), vindo do servidor: o agrupamento por prazo parte dele. */
  todayKey: string;
  /** Dias até o casamento, quando há data. */
  daysLeft: number | null;
  initialFilter: FiltroDeTarefas;
  /** Cartão de sugestão da Liz (decidido no servidor com dados reais). */
  suggestion?: ReactNode;
}

function textoDosDiasQueFaltam(daysLeft: number | null) {
  if (daysLeft === null) return "";
  if (daysLeft > 0) return daysLeft === 1 ? " · falta 1 dia" : ` · faltam ${daysLeft} dias`;
  return daysLeft === 0 ? " · o casamento é hoje" : "";
}

/** No celular, o botão redondo de "Nova tarefa" fica acima do atalho da Liz. */
function BotaoFlutuanteDeNovaTarefa({ aoClicar }: { aoClicar: () => void }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-label="Nova tarefa"
      className="fixed bottom-[calc(var(--liz-fab-bottom,6rem)+56px+12px)] right-4 z-30 grid size-14 cursor-pointer place-items-center rounded-t-full rounded-b-2xl bg-ameixa text-on-ameixa shadow-[var(--shadow-aceito-2)] transition-colors hover:bg-ameixa-hover md:hidden"
    >
      <Plus className="size-6" aria-hidden="true" />
    </button>
  );
}

export function QuadroDeTarefas({ initialTasks, todayKey, daysLeft, initialFilter, suggestion }: PropriedadesDoQuadroDeTarefas) {
  const t = useTarefas(initialTasks);
  const [filter, setFilter] = useState<FiltroDeTarefas>(initialFilter);

  const done = t.tasks.filter(tarefaEstaConcluida).length;
  const total = t.tasks.length;
  const overdue = tarefasAtrasadas(
    t.tasks.filter((x) => !tarefaEstaConcluida(x)),
    todayKey,
  );
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const groups = agruparTarefas(t.tasks, filter, todayKey);

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDaPagina
        eyebrow="Organização"
        title="Tarefas"
        description={total === 0 ? "O que falta fazer até o grande dia, num só lugar." : `${done} de ${total} ${total === 1 ? "concluída" : "concluídas"}${textoDosDiasQueFaltam(daysLeft)}`}
        actions={
          <button type="button" onClick={() => t.abrirModal(null)} className={`${estiloDoBotao.primary} max-md:hidden`}>
            <Plus className="size-4" aria-hidden="true" />
            Nova tarefa
          </button>
        }
      />

      {total > 0 && (
        <div role="progressbar" aria-label="Tarefas concluídas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2 overflow-hidden rounded-full bg-areia">
          <div className="h-full rounded-full bg-ameixa transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
      )}

      {total === 0 ? (
        <SemTarefas aoCriar={() => t.abrirModal(null)} />
      ) : (
        <>
          <FiltrosDeTarefas filter={filter} aoMudar={setFilter} abertas={total - done} atrasadas={overdue.length} concluidas={done} />
          <ListaDeTarefas groups={groups} filter={filter} todayKey={todayKey} aoAlternar={(x) => void t.toggle(x)} aoEditar={t.abrirModal} />
        </>
      )}

      {suggestion}
      <BotaoFlutuanteDeNovaTarefa aoClicar={() => t.abrirModal(null)} />
      <ModalDaTarefa open={t.modalOpen} onOpenChange={t.setModalOpen} task={t.editing} onSave={t.save} onDelete={t.remove} />
    </div>
  );
}
