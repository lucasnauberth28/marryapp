"use client";

// O estado das tarefas na tela: atualiza na hora e desfaz se o servidor recusar.
import { useState } from "react";
import { toast } from "sonner";
import { SituacaoDaTarefa, type ItemDoQuadro } from "@/types/kanban";
import { criarTarefa, excluirTarefa, atualizarTarefa, atualizarSituacaoDaTarefa } from "@/actions/tasks";
import type { DadosDoFormularioDaTarefa } from "../formulario/tipos";
import { tarefaEstaConcluida } from "./prazos";

type Definir = React.Dispatch<React.SetStateAction<ItemDoQuadro[]>>;

async function salvarEdicao(id: string, data: DadosDoFormularioDaTarefa, setTasks: Definir) {
  const toastId = toast.loading("Salvando a tarefa...");
  const res = await atualizarTarefa(id, data);
  if (res.success && res.data) {
    const updated: ItemDoQuadro = { ...res.data, type: "MANUAL" };
    setTasks((cur) => cur.map((t) => (t.id === updated.id ? updated : t)));
    toast.success("Tarefa salva.", { id: toastId });
    return true;
  }
  toast.error(res.error || "Não deu para salvar a tarefa. Tente de novo.", { id: toastId });
  return false;
}

async function salvarNova(data: DadosDoFormularioDaTarefa, setTasks: Definir) {
  const toastId = toast.loading("Criando a tarefa...");
  const res = await criarTarefa({
    title: data.title,
    status: data.status,
    description: data.description ?? undefined,
    assignee: data.assignee ?? undefined,
    dueDate: data.dueDate ?? undefined,
  });
  if (res.success && res.data) {
    setTasks((cur) => [...cur, { ...res.data, type: "MANUAL" }]);
    toast.success("Tarefa criada.", { id: toastId });
    return true;
  }
  toast.error(res.error || "Não deu para criar a tarefa. Tente de novo.", { id: toastId });
  return false;
}

export function useTarefas(initialTasks: ItemDoQuadro[]) {
  const [tasks, setTasks] = useState<ItemDoQuadro[]>(initialTasks);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ItemDoQuadro | null>(null);

  async function toggle(task: ItemDoQuadro) {
    const next = tarefaEstaConcluida(task) ? SituacaoDaTarefa.TODO : SituacaoDaTarefa.DONE;
    setTasks((cur) => cur.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    const res = await atualizarSituacaoDaTarefa(task.id, next, task.position, task.type);
    if (!res.success) {
      setTasks((cur) => cur.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
      toast.error(res.error || "Não deu para atualizar a tarefa. Tente de novo.");
    } else if (next === SituacaoDaTarefa.DONE) {
      toast.success("Tarefa concluída.", { action: { label: "Desfazer", onClick: () => void toggle({ ...task, status: SituacaoDaTarefa.DONE }) } });
    }
  }

  function abrirModal(task: ItemDoQuadro | null) {
    setEditing(task);
    setModalOpen(true);
  }

  const save = (data: DadosDoFormularioDaTarefa) => (editing ? salvarEdicao(editing.id, data, setTasks) : salvarNova(data, setTasks));

  async function remove(id: string) {
    const toastId = toast.loading("Removendo a tarefa...");
    const res = await excluirTarefa(id);
    if (res.success) {
      setTasks((cur) => cur.filter((t) => t.id !== id));
      toast.success("Tarefa removida.", { id: toastId });
      return true;
    }
    toast.error(res.error || "Não deu para remover agora. Tente de novo.", { id: toastId });
    return false;
  }

  return { tasks, modalOpen, setModalOpen, editing, abrirModal, toggle, save, remove };
}
