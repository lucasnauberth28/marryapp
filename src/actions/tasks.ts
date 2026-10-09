"use server";

import { requireWedding } from "@/lib/security/wedding-context";

import prisma from "@/lib/prisma";
import { Prisma, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { BoardItem, BoardItemType } from "@/types/kanban";

const TASK_STATUSES = new Set<string>(Object.values(TaskStatus));

function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && TASK_STATUSES.has(value);
}

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return typeof value === "string" ? value.slice(0, max) : undefined;
}

function optionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function getTasks() {
  const { weddingId } = await requireWedding("/pendencias");
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
    return { success: false, error: "Falha ao carregar as tarefas." };
  }
}

export async function createTask(data: {
  title: string;
  description?: string;
  dueDate?: Date;
  assignee?: string;
  status: TaskStatus;
}) {
  const { weddingId } = await requireWedding("/pendencias");
  // Só os campos da tarefa: nada do que o navegador enviar decide o casamento
  const title = typeof data?.title === "string" ? data.title.trim().slice(0, 200) : "";
  if (!title) return { success: false, error: "Informe o título da tarefa." };
  if (!isTaskStatus(data.status)) return { success: false, error: "Status inválido." };

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
        description: optionalText(data.description, 5000) ?? null,
        dueDate: optionalDate(data.dueDate) ?? null,
        assignee: optionalText(data.assignee, 120) ?? null,
        status: data.status,
        position: newPosition,
      },
    });

    revalidatePath("/pendencias");
    return { success: true, data: task };
  } catch (error) {
    console.error("Failed to create task:", error);
    return { success: false, error: "Falha ao criar a tarefa." };
  }
}

export async function updateTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
  newPosition: number,
  type: BoardItemType = "MANUAL"
) {
  const { weddingId } = await requireWedding("/pendencias");
  if (typeof taskId !== "string" || !isTaskStatus(newStatus) || !Number.isFinite(Number(newPosition))) {
    return { success: false, error: "Falha ao atualizar o status." };
  }
  try {
    const result = await prisma.task.updateMany({
      where: { id: taskId, weddingId },
      data: {
        status: newStatus,
        position: Math.round(Number(newPosition)),
      },
    });
    if (result.count === 0) return { success: false, error: "Tarefa não encontrada." };

    revalidatePath("/pendencias");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update task status:", error);
    return { success: false, error: "Falha ao atualizar o status." };
  }
}

export async function updateTask(taskId: string, data: Partial<{
  title: string;
  description: string | null;
  dueDate: Date | null;
  assignee: string | null;
  status: TaskStatus;
}>) {
  const { weddingId } = await requireWedding("/pendencias");
  if (typeof taskId !== "string" || !data || typeof data !== "object") {
    return { success: false, error: "Falha ao atualizar a tarefa." };
  }

  // Só os campos editáveis da tarefa
  const update: Prisma.TaskUpdateManyMutationInput = {};
  if (data.title !== undefined) {
    const title = typeof data.title === "string" ? data.title.trim().slice(0, 200) : "";
    if (!title) return { success: false, error: "Informe o título da tarefa." };
    update.title = title;
  }
  const description = optionalText(data.description, 5000);
  if (description !== undefined) update.description = description;
  const dueDate = optionalDate(data.dueDate);
  if (dueDate !== undefined) update.dueDate = dueDate;
  const assignee = optionalText(data.assignee, 120);
  if (assignee !== undefined) update.assignee = assignee;
  if (data.status !== undefined) {
    if (!isTaskStatus(data.status)) return { success: false, error: "Status inválido." };
    update.status = data.status;
  }

  try {
    const result = await prisma.task.updateMany({
      where: { id: taskId, weddingId },
      data: update,
    });
    if (result.count === 0) return { success: false, error: "Tarefa não encontrada." };
    const task = await prisma.task.findFirst({ where: { id: taskId, weddingId } });

    revalidatePath("/pendencias");
    return { success: true, data: task };
  } catch (error) {
    console.error("Failed to update task:", error);
    return { success: false, error: "Falha ao atualizar a tarefa." };
  }
}

export async function deleteTask(taskId: string) {
  const { weddingId } = await requireWedding("/pendencias");
  try {
    if (typeof taskId !== "string") return { success: false, error: "Tarefa não encontrada." };
    const result = await prisma.task.deleteMany({
      where: { id: taskId, weddingId },
    });
    if (result.count === 0) return { success: false, error: "Tarefa não encontrada." };

    revalidatePath("/pendencias");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { success: false, error: "Falha ao excluir a tarefa." };
  }
}
