"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTablesWithGuests() {
  return prisma.table.findMany({
    include: {
      guests: {
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
  return prisma.guest.findMany({
    where: { 
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
  try {
    await prisma.table.create({
      data: { name, capacity },
    });
    revalidatePath("/convidados");
    revalidatePath("/(admin)/convidados", "page");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao criar mesa." };
  }
}

export async function deleteTable(id: string) {
  try {
    await prisma.table.delete({ where: { id } });
    revalidatePath("/convidados");
    revalidatePath("/(admin)/convidados", "page");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir mesa." };
  }
}

export async function assignGuestToTable(guestId: string, tableId: string | null) {
  try {
    await prisma.guest.update({
      where: { id: guestId },
      data: { tableId },
    });
    revalidatePath("/convidados");
    revalidatePath("/(admin)/convidados", "page");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao mover convidado." };
  }
}
