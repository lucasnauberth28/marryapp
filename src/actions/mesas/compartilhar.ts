"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { exigirCasamento } from "@/lib/security/wedding-context";

// Link "Ache a sua mesa": só leitura, em todos os planos. Só o casal cria, troca ou desliga (exigirCasamento).

type Resultado<T = object> = ({ success: true } & T) | { success: false; error: string };

/**
 * Cria o link, ou troca por um novo (o antigo deixa de funcionar na hora).
 * O código tem 144 bits aleatórios: não dá para adivinhar nem listar.
 */
export async function criarLinkDeCompartilhamentoDasMesas(): Promise<Resultado<{ token: string }>> {
  const ctx = await exigirCasamento("/mesas");
  try {
    const token = randomBytes(18).toString("base64url");
    await prisma.wedding.update({ where: { id: ctx.weddingId }, data: { tablesShareToken: token } });
    revalidatePath("/mesas");
    return { success: true, token };
  } catch {
    return { success: false, error: "Não deu para criar o link. Tente de novo." };
  }
}

export async function desativarLinkDeCompartilhamentoDasMesas(): Promise<Resultado> {
  const ctx = await exigirCasamento("/mesas");
  try {
    await prisma.wedding.update({ where: { id: ctx.weddingId }, data: { tablesShareToken: null } });
    revalidatePath("/mesas");
    return { success: true };
  } catch {
    return { success: false, error: "Não deu para desligar o link. Tente de novo." };
  }
}
