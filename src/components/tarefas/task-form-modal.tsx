"use client";

import { useId, useState } from "react";
import { ItemDoQuadro, SituacaoDaTarefa } from "@/types/kanban";
import { ModalPersonalizado } from "@/components/ui/custom-modal";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { SelecaoNativa } from "@/components/ui/select";
import { estiloDoBotao, estiloDoBotaoDePerigo } from "@/components/painel/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";

export interface DadosDoFormularioDaTarefa {
  title: string;
  description: string | null;
  status: SituacaoDaTarefa;
  assignee: string | null;
  dueDate: Date | null;
}

interface PropriedadesDoModalDaTarefa {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ItemDoQuadro | null;
  /** Devolve true quando salvou (o formulário fecha). */
  onSave: (data: DadosDoFormularioDaTarefa) => Promise<boolean>;
  onDelete: (taskId: string) => Promise<boolean>;
}

// O formulário só existe com o modal aberto: cada abertura começa do zero (ou da tarefa escolhida).
function FormularioDaTarefa({ task, onSave, onDelete, onClose }: { task: ItemDoQuadro | null; onSave: PropriedadesDoModalDaTarefa["onSave"]; onDelete: PropriedadesDoModalDaTarefa["onDelete"]; onClose: () => void }) {
  const ids = { title: useId(), description: useId(), status: useId(), assignee: useId(), due: useId() };
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<SituacaoDaTarefa>(task?.status ?? SituacaoDaTarefa.TODO);
  const [assignee, setAssignee] = useState(task?.assignee ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Diga o que precisa ser feito.");
      return;
    }
    setError(null);
    setBusy(true);
    const ok = await onSave({
      title: title.trim(),
      description: description.trim() || null,
      status,
      assignee: assignee.trim() || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    });
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Entrada
          id={ids.title}
          label="O que precisa ser feito?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Fechar contrato do buffet"
          disabled={busy}
          error={error && !title.trim() ? error : undefined}
        />

        <AreaDeTexto id={ids.description} label="Detalhes" optional value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={busy} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Entrada id={ids.due} type="date" label="Prazo" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={busy} />
          <Entrada id={ids.assignee} label="Quem cuida" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Nome" disabled={busy} />
        </div>

        <SelecaoNativa id={ids.status} label="Como está" value={status} onChange={(e) => setStatus(e.target.value as SituacaoDaTarefa)} disabled={busy}>
          <option value={SituacaoDaTarefa.TODO}>A fazer</option>
          <option value={SituacaoDaTarefa.IN_PROGRESS}>Em andamento</option>
          <option value={SituacaoDaTarefa.DONE}>Concluída</option>
        </SelecaoNativa>

        <div className="flex flex-col gap-2 border-t border-linha pt-4">
          <BotaoComCarregamento type="submit" loading={busy} className={`${estiloDoBotao.primary} ${estiloDoBotao.block}`}>
            {task ? "Salvar alterações" : "Criar tarefa"}
          </BotaoComCarregamento>
          <button type="button" onClick={onClose} disabled={busy} className={`${estiloDoBotao.quiet} ${estiloDoBotao.block}`}>
            Cancelar
          </button>
          {task && (
            <button type="button" onClick={() => setConfirmOpen(true)} disabled={busy} className={`${estiloDoBotaoDePerigo} w-full`}>
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
