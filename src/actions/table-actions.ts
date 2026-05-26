"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTablesWithGuests() {
  return prisma.table.findMany({
    include: { guests: true },
    orderBy: { createdAt: "asc" }
  });
}

export async function getUnassignedGuests() {
  return prisma.guest.findMany({
    where: { 
      tableId: null,
      rsvpStatus: "CONFIRMED" // Só mostrar os confirmados
    },
    orderBy: { name: "asc" }
  });
}

export async function createTable(name: string, capacity: number) {
  try {
    await prisma.table.create({
      data: { name, capacity }
    });
    revalidatePath("/(admin)/mesas", "page");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao criar mesa." };
  }
}

export async function deleteTable(id: string) {
  try {
    await prisma.table.delete({ where: { id } });
    revalidatePath("/(admin)/mesas", "page");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir mesa." };
  }
}

export async function assignGuestToTable(guestId: string, tableId: string | null) {
  try {
    await prisma.guest.update({
      where: { id: guestId },
      data: { tableId }
    });
    // Não usar revalidatePath aqui se a UI já está atualizando otimisticamente (no frontend via dnd-kit)
    // Mas para segurança, garantimos que a rota revalida no próximo load
    revalidatePath("/(admin)/mesas", "page");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao mover convidado." };
  }
}
