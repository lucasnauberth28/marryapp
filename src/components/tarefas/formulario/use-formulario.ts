"use client";

import { useId, useState } from "react";
import { SituacaoDaTarefa, type ItemDoQuadro } from "@/types/kanban";
import type { DadosDoFormularioDaTarefa } from "./tipos";

/** Os campos do formulário e o envio (o título é obrigatório). Devolve true ao salvar para o modal fechar. */
export function useFormularioDaTarefa(task: ItemDoQuadro | null, onSave: (data: DadosDoFormularioDaTarefa) => Promise<boolean>, onClose: () => void) {
  const ids = { title: useId(), description: useId(), status: useId(), assignee: useId(), due: useId() };
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<SituacaoDaTarefa>(task?.status ?? SituacaoDaTarefa.TODO);
  const [assignee, setAssignee] = useState(task?.assignee ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return { ids, title, setTitle, description, setDescription, status, setStatus, assignee, setAssignee, dueDate, setDueDate, busy, error, submit };
}
