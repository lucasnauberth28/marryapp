"use client";

import { useState } from "react";
import type { ItemDoQuadro } from "@/types/kanban";
import { ModalPersonalizado } from "@/components/ui/custom-modal";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { SelecaoNativa } from "@/components/ui/select";
import { estiloDoBotao, estiloDoBotaoDePerigo } from "@/components/painel/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { SituacaoDaTarefa } from "@/types/kanban";
import type { DadosDoFormularioDaTarefa } from "./formulario/tipos";
import { useFormularioDaTarefa } from "./formulario/use-formulario";

export type { DadosDoFormularioDaTarefa } from "./formulario/tipos";

interface PropriedadesDoModalDaTarefa {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ItemDoQuadro | null;
  /** Devolve true quando salvou (o formulário fecha). */
  onSave: (data: DadosDoFormularioDaTarefa) => Promise<boolean>;
  onDelete: (taskId: string) => Promise<boolean>;
}

interface PropriedadesDoFormulario {
  task: ItemDoQuadro | null;
  onSave: PropriedadesDoModalDaTarefa["onSave"];
  onDelete: PropriedadesDoModalDaTarefa["onDelete"];
  onClose: () => void;
}

function CamposDaTarefa({ f }: { f: ReturnType<typeof useFormularioDaTarefa> }) {
  return (
    <>
      <Entrada
        id={f.ids.title}
        label="O que precisa ser feito?"
        value={f.title}
        onChange={(e) => f.setTitle(e.target.value)}
        placeholder="Ex.: Fechar contrato do buffet"
        disabled={f.busy}
        error={f.error && !f.title.trim() ? f.error : undefined}
      />

      <AreaDeTexto id={f.ids.description} label="Detalhes" optional value={f.description} onChange={(e) => f.setDescription(e.target.value)} rows={3} disabled={f.busy} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Entrada id={f.ids.due} type="date" label="Prazo" value={f.dueDate} onChange={(e) => f.setDueDate(e.target.value)} disabled={f.busy} />
        <Entrada id={f.ids.assignee} label="Quem cuida" value={f.assignee} onChange={(e) => f.setAssignee(e.target.value)} placeholder="Nome" disabled={f.busy} />
      </div>

      <SelecaoNativa id={f.ids.status} label="Como está" value={f.status} onChange={(e) => f.setStatus(e.target.value as SituacaoDaTarefa)} disabled={f.busy}>
        <option value={SituacaoDaTarefa.TODO}>A fazer</option>
        <option value={SituacaoDaTarefa.IN_PROGRESS}>Em andamento</option>
        <option value={SituacaoDaTarefa.DONE}>Concluída</option>
      </SelecaoNativa>
    </>
  );
}

// O formulário só existe com o modal aberto: cada abertura começa do zero (ou da tarefa escolhida).
function FormularioDaTarefa({ task, onSave, onDelete, onClose }: PropriedadesDoFormulario) {
  const f = useFormularioDaTarefa(task, onSave, onClose);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <form onSubmit={f.submit} className="flex flex-col gap-5">
        <CamposDaTarefa f={f} />

        <div className="flex flex-col gap-2 border-t border-linha pt-4">
          <BotaoComCarregamento type="submit" loading={f.busy} className={`${estiloDoBotao.primary} ${estiloDoBotao.block}`}>
            {task ? "Salvar alterações" : "Criar tarefa"}
          </BotaoComCarregamento>
          <button type="button" onClick={onClose} disabled={f.busy} className={`${estiloDoBotao.quiet} ${estiloDoBotao.block}`}>
            Cancelar
          </button>
          {task && (
            <button type="button" onClick={() => setConfirmOpen(true)} disabled={f.busy} className={`${estiloDoBotaoDePerigo} w-full`}>
              Excluir tarefa
            </button>
          )}
        </div>
      </form>

      <ModalDeConfirmacao
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          if (task && (await onDelete(task.id))) onClose();
        }}
        title="Excluir tarefa"
        description={task ? `Excluir "${task.title}"? Não dá para desfazer.` : ""}
        confirmText="Excluir"
      />
    </>
  );
}

export function ModalDaTarefa({ open, onOpenChange, task, onSave, onDelete }: PropriedadesDoModalDaTarefa) {
  return (
    <ModalPersonalizado isOpen={open} onClose={() => onOpenChange(false)} title={task ? "Editar tarefa" : "Nova tarefa"} size="sm" className="max-h-[92vh] overflow-y-auto">
      <FormularioDaTarefa task={task} onSave={onSave} onDelete={onDelete} onClose={() => onOpenChange(false)} />
    </ModalPersonalizado>
  );
}
