"use server";

import prisma from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { BoardItem, BoardItemType } from "@/types/kanban";

export async function getTasks() {
  try {
    const tasks = await prisma.task.findMany({
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
  try {
    // Acha a maior posição atual para essa coluna
    const maxPositionTask = await prisma.task.findFirst({
      where: { status: data.status },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const newPosition = (maxPositionTask?.position ?? 0) + 1024; // Incremento de 1024 para facilitar drag and drop

    const task = await prisma.task.create({
      data: {
        ...data,
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
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        position: newPosition,
      },
    });

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
  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data,
    });

    revalidatePath("/pendencias");
    return { success: true, data: task };
  } catch (error) {
    console.error("Failed to update task:", error);
    return { success: false, error: "Falha ao atualizar a tarefa." };
  }
}

export async function deleteTask(taskId: string) {
  try {
    await prisma.task.delete({
      where: { id: taskId },
    });

    revalidatePath("/pendencias");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { success: false, error: "Falha ao excluir a tarefa." };
  }
}
