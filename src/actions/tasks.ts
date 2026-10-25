"use server";

import { exigirCasamento, exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";

import prisma from "@/lib/prisma";
import { Prisma, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { BoardItem, BoardItemType } from "@/types/kanban";

import { ERROS } from "@/lib/mensagens-de-erro";
const SITUACOES_DA_TAREFA = new Set<string>(Object.values(TaskStatus));

function ehSituacaoDeTarefa(value: unknown): value is TaskStatus {
  return typeof value === "string" && SITUACOES_DA_TAREFA.has(value);
}

function textoOpcional(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return typeof value === "string" ? value.slice(0, max) : undefined;
}

function dataOpcional(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function obterTarefas() {
  const { weddingId } = await exigirCasamentoParaLeitura("/pendencias");
  try {
    const tasks = await prisma.task.findMany({
      where: { weddingId },
      orderBy: {
        position: 'asc',
      },
    });

    const boardItems: BoardItem[] = tasks.map(t => ({
      id: t.id,
      type: "MANUAL" as const,
      title: t.title,
      description: t.description,
      dueDate: t.dueDate,
      assignee: t.assignee,
      status: t.status,
      position: t.position,
    }));

    return { success: true, data: boardItems };
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return { success: false, error: "Não deu para carregar as tarefas. Tente de novo." };
  }
}

export async function criarTarefa(data: {
  title: string;
  description?: string;
  dueDate?: Date;
  assignee?: string;
  status: TaskStatus;
}) {
  const { weddingId } = await exigirCasamento("/pendencias");
  // Só os campos da tarefa: nada do que o navegador enviar decide o casamento
  const title = typeof data?.title === "string" ? data.title.trim().slice(0, 200) : "";
  if (!title) return { success: false, error: "Informem o que precisa ser feito." };
  if (!ehSituacaoDeTarefa(data.status)) return { success: false, error: "Situação da tarefa inválida." };

  try {
    // Acha a maior posição atual para essa coluna
    const maxPositionTask = await prisma.task.findFirst({
      where: { weddingId, status: data.status },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const newPosition = (maxPositionTask?.position ?? 0) + 1024; // Incremento de 1024 para facilitar drag and drop

    const task = await prisma.task.create({
      data: {
        weddingId,
        title,
        description: textoOpcional(data.description, 5000) ?? null,
        dueDate: dataOpcional(data.dueDate) ?? null,
        assignee: textoOpcional(data.assignee, 120) ?? null,
        status: data.status,
        position: newPosition,
      },
    });

    revalidatePath("/pendencias");
    return { success: true, data: task };
  } catch (error) {
    console.error("Failed to create task:", error);
    return { success: false, error: "Não deu para criar a tarefa. Tente de novo." };
  }
}

export async function atualizarSituacaoDaTarefa(
  taskId: string,
  newStatus: TaskStatus,
  newPosition: number,
  type: BoardItemType = "MANUAL"
) {
  const { weddingId } = await exigirCasamento("/pendencias");
  if (typeof taskId !== "string" || !ehSituacaoDeTarefa(newStatus) || !Number.isFinite(Number(newPosition))) {
    return { success: false, error: "Não deu para atualizar a tarefa. Tente de novo." };
  }
  try {
    const result = await prisma.task.updateMany({
      where: { id: taskId, weddingId },
      data: {
        status: newStatus,
        position: Math.round(Number(newPosition)),
      },
    });
    if (result.count === 0) return { success: false, error: ERROS.tarefaNaoEncontrada };

    revalidatePath("/pendencias");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update task status:", error);
    return { success: false, error: "Não deu para atualizar a tarefa. Tente de novo." };
  }
}

export async function atualizarTarefa(taskId: string, data: Partial<{
  title: string;
  description: string | null;
  dueDate: Date | null;
  assignee: string | null;
  status: TaskStatus;
}>) {
  const { weddingId } = await exigirCasamento("/pendencias");
  if (typeof taskId !== "string" || !data || typeof data !== "object") {
    return { success: false, error: "Não deu para salvar a tarefa. Tente de novo." };
  }

  // Só os campos editáveis da tarefa
  const update: Prisma.TaskUpdateManyMutationInput = {};
  if (data.title !== undefined) {
    const title = typeof data.title === "string" ? data.title.trim().slice(0, 200) : "";
    if (!title) return { success: false, error: "Informem o que precisa ser feito." };
    update.title = title;
  }
  const description = textoOpcional(data.description, 5000);
  if (description !== undefined) update.description = description;
  const dueDate = dataOpcional(data.dueDate);
  if (dueDate !== undefined) update.dueDate = dueDate;
  const assignee = textoOpcional(data.assignee, 120);
  if (assignee !== undefined) update.assignee = assignee;
  if (data.status !== undefined) {
    if (!ehSituacaoDeTarefa(data.status)) return { success: false, error: "Situação da tarefa inválida." };
    update.status = data.status;
  }

  try {
    const result = await prisma.task.updateMany({
      where: { id: taskId, weddingId },
      data: update,
    });
    if (result.count === 0) return { success: false, error: ERROS.tarefaNaoEncontrada };
    const task = await prisma.task.findFirst({ where: { id: taskId, weddingId } });

    revalidatePath("/pendencias");
    return { success: true, data: task };
  } catch (error) {
    console.error("Failed to update task:", error);
    return { success: false, error: "Não deu para salvar a tarefa. Tente de novo." };
  }
}

export async function excluirTarefa(taskId: string) {
  const { weddingId } = await exigirCasamento("/pendencias");
  try {
    if (typeof taskId !== "string") return { success: false, error: ERROS.tarefaNaoEncontrada };
    const result = await prisma.task.deleteMany({
      where: { id: taskId, weddingId },
    });
    if (result.count === 0) return { success: false, error: ERROS.tarefaNaoEncontrada };

    revalidatePath("/pendencias");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { success: false, error: "Não deu para remover a tarefa. Tente de novo." };
  }
}
