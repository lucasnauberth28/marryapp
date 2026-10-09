"use server";

import { requireWedding } from "@/lib/security/wedding-context";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const VendorSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
  category: z.string().min(2, "Categoria é obrigatória."),
  contact: z.string().optional(),
  contractUrl: z.string().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function getVendors() {
  const { weddingId } = await requireWedding();
  return prisma.vendor.findMany({
    where: { weddingId },
    orderBy: { createdAt: "desc" },
    include: {
      expenses: { where: { weddingId } } // Traz as despesas amarradas ao fornecedor
    }
  });
}

export async function createVendor(formData: FormData) {
  const { weddingId } = await requireWedding("/meus-fornecedores");
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
    await prisma.vendor.create({ data: { ...parsed.data, weddingId } });
    revalidatePath("/(admin)/fornecedores", "page");
    return { success: true };
  } catch (error) {
    console.error("[createVendor]", error);
    return { success: false, error: "Erro ao criar fornecedor." };
  }
}

export async function updateVendor(id: string, formData: FormData) {
  const { weddingId } = await requireWedding("/meus-fornecedores");
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
    if (typeof id !== "string") return { success: false, error: "Fornecedor não encontrado." };
    const result = await prisma.vendor.updateMany({
      where: { id, weddingId },
      data: parsed.data,
    });
    if (result.count === 0) return { success: false, error: "Fornecedor não encontrado." };
    revalidatePath("/(admin)/fornecedores", "page");
    revalidatePath("/(admin)/financas", "page");
    return { success: true };
  } catch (error) {
    console.error("[updateVendor]", error);
    return { success: false, error: "Erro ao atualizar fornecedor." };
  }
}

export async function deleteVendor(id: string) {
  const { weddingId } = await requireWedding("/meus-fornecedores");
  try {
    if (typeof id !== "string") return { success: false, error: "Fornecedor não encontrado." };
    const result = await prisma.vendor.deleteMany({ where: { id, weddingId } });
    if (result.count === 0) return { success: false, error: "Fornecedor não encontrado." };
    revalidatePath("/(admin)/fornecedores", "page");
    return { success: true };
  } catch (error) {
    console.error("[deleteVendor]", error);
    return { success: false, error: "Erro ao excluir fornecedor. Ele pode ter despesas vinculadas." };
  }
}
