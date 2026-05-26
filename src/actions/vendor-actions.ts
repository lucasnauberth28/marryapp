"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const VendorSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
  category: z.string().min(2, "Categoria é obrigatória."),
  contact: z.string().optional(),
  contractUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function getVendors() {
  return prisma.vendor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      expenses: true // Traz as despesas amarradas ao fornecedor
    }
  });
}

export async function createVendor(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    category: formData.get("category"),
    contact: formData.get("contact") || undefined,
    contractUrl: formData.get("contractUrl") || undefined,
    notes: formData.get("notes") || undefined,
  };

  const parsed = VendorSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await prisma.vendor.create({ data: parsed.data });
    revalidatePath("/(admin)/fornecedores", "page");
    return { success: true };
  } catch (error) {
    console.error("[createVendor]", error);
    return { success: false, error: "Erro ao criar fornecedor." };
  }
}

export async function deleteVendor(id: string) {
  try {
    await prisma.vendor.delete({ where: { id } });
    revalidatePath("/(admin)/fornecedores", "page");
    return { success: true };
  } catch (error) {
    console.error("[deleteVendor]", error);
    return { success: false, error: "Erro ao excluir fornecedor. Ele pode ter despesas vinculadas." };
  }
}
