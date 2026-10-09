"use server";

import { requireWedding } from "@/lib/security/wedding-context";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTablesWithGuests() {
  const { weddingId } = await requireWedding();
  return prisma.table.findMany({
    where: { weddingId },
    include: {
      guests: {
        where: { weddingId },
        include: {
          parentGuest: true,
          linkedGuests: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getUnassignedGuests() {
  const { weddingId } = await requireWedding();
  return prisma.guest.findMany({
    where: {
      weddingId,
      tableId: null,
      rsvpStatus: "CONFIRMED",
    },
    include: {
      parentGuest: true,
      linkedGuests: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function createTable(name: string, capacity: number) {
  const { weddingId } = await requireWedding("/mesas");
  try {
    const cleanName = typeof name === "string" ? name.trim().slice(0, 120) : "";
    const cleanCapacity = Number.isFinite(Number(capacity)) ? Math.max(1, Math.min(500, Math.round(Number(capacity)))) : 10;
    if (!cleanName) return { success: false, error: "Informe o nome da mesa." };

    await prisma.table.create({
      data: { weddingId, name: cleanName, capacity: cleanCapacity },
    });
    revalidatePath("/convidados");
    revalidatePath("/(admin)/convidados", "page");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao criar mesa." };
  }
}

export async function deleteTable(id: string) {
  const { weddingId } = await requireWedding("/mesas");
  try {
    if (typeof id !== "string") return { success: false, error: "Mesa não encontrada." };
    const table = await prisma.table.findFirst({ where: { id, weddingId }, select: { id: true } });
    if (!table) return { success: false, error: "Mesa não encontrada." };

    // Os convidados da mesa voltam para "sem mesa" antes de apagá-la
    await prisma.$transaction([
      prisma.guest.updateMany({ where: { tableId: table.id, weddingId }, data: { tableId: null } }),
      prisma.table.deleteMany({ where: { id: table.id, weddingId } }),
    ]);
    revalidatePath("/convidados");
    revalidatePath("/(admin)/convidados", "page");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao excluir mesa." };
  }
}

export async function assignGuestToTable(guestId: string, tableId: string | null) {
  const { weddingId } = await requireWedding("/mesas");
  try {
    if (typeof guestId !== "string") return { success: false, error: "Convidado não encontrado." };

    // A mesa precisa ser do mesmo casamento do convidado
    if (tableId !== null) {
      if (typeof tableId !== "string") return { success: false, error: "Mesa não encontrada." };
      const table = await prisma.table.findFirst({ where: { id: tableId, weddingId }, select: { id: true } });
      if (!table) return { success: false, error: "Mesa não encontrada." };
    }

    const result = await prisma.guest.updateMany({
      where: { id: guestId, weddingId },
      data: { tableId },
    });
    if (result.count === 0) return { success: false, error: "Convidado não encontrado." };

    revalidatePath("/convidados");
    revalidatePath("/(admin)/convidados", "page");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao mover convidado." };
  }
}
