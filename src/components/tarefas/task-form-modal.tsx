"use client";

import { useId, useState } from "react";
import { BoardItem, TaskStatus } from "@/types/kanban";
import { CustomModal } from "@/components/ui/custom-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { btn, btnDanger } from "@/components/painel/styles";
import { LoadingButton } from "@/components/painel/loading-button";

export interface TaskFormData {
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee: string | null;
  dueDate: Date | null;
}

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: BoardItem | null;
  /** Devolve true quando salvou (o formulário fecha). */
  onSave: (data: TaskFormData) => Promise<boolean>;
  onDelete: (taskId: string) => Promise<boolean>;
}

// O formulário só existe com o modal aberto: cada abertura começa do zero (ou da tarefa escolhida).
function TaskForm({ task, onSave, onDelete, onClose }: { task: BoardItem | null; onSave: TaskFormModalProps["onSave"]; onDelete: TaskFormModalProps["onDelete"]; onClose: () => void }) {
  const ids = { title: useId(), description: useId(), status: useId(), assignee: useId(), due: useId() };
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? TaskStatus.TODO);
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
        <Input
          id={ids.title}
          label="O que precisa ser feito?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Fechar contrato do buffet"
          disabled={busy}
          error={error && !title.trim() ? error : undefined}
        />

        <Textarea id={ids.description} label="Detalhes" optional value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={busy} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input id={ids.due} type="date" label="Prazo" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={busy} />
          <Input id={ids.assignee} label="Quem cuida" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Nome" disabled={busy} />
        </div>

        <NativeSelect id={ids.status} label="Como está" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} disabled={busy}>
          <option value={TaskStatus.TODO}>A fazer</option>
          <option value={TaskStatus.IN_PROGRESS}>Em andamento</option>
          <option value={TaskStatus.DONE}>Concluída</option>
        </NativeSelect>

        <div className="flex flex-col gap-2 border-t border-linha pt-4">
          <LoadingButton type="submit" loading={busy} className={`${btn.primary} ${btn.block}`}>
            {task ? "Salvar alterações" : "Criar tarefa"}
          </LoadingButton>
          <button type="button" onClick={onClose} disabled={busy} className={`${btn.quiet} ${btn.block}`}>
            Cancelar
          </button>
          {task && (
            <button type="button" onClick={() => setConfirmOpen(true)} disabled={busy} className={`${btnDanger} w-full`}>
              Excluir tarefa
            </button>
          )}
        </div>
      </form>

      <ConfirmModal
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

export function TaskFormModal({ open, onOpenChange, task, onSave, onDelete }: TaskFormModalProps) {
  return (
    <CustomModal isOpen={open} onClose={() => onOpenChange(false)} title={task ? "Editar tarefa" : "Nova tarefa"} size="sm" className="max-h-[92vh] overflow-y-auto">
      <TaskForm task={task} onSave={onSave} onDelete={onDelete} onClose={() => onOpenChange(false)} />
    </CustomModal>
  );
}
