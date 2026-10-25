"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { exigirCasamento } from "@/lib/security/wedding-context";
import { recusaDeModulo } from "@/lib/wedding-plan";
import { ehIdDeCenario } from "@/lib/mesas3d/scenarios";

// Mesas em 3D: cenário escolhido e link de visualização. Só o casal altera (requireWedding), e só com o módulo do plano.
// Sentar convidados continua pela ação assignGuestToTable, a mesma da lista de mesas.

type Result<T = object> = ({ success: true } & T) | { success: false; error: string };

export async function setTables3DScene(scene: string): Promise<Result> {
  const ctx = await exigirCasamento("/mesas");
  const refusal = await recusaDeModulo(ctx, "tables3d");
  if (refusal) return { success: false, error: refusal };
  if (!ehIdDeCenario(scene)) return { success: false, error: "Cenário não encontrado." };
  try {
    await prisma.wedding.update({ where: { id: ctx.weddingId }, data: { tables3dScene: scene } });
    return { success: true };
  } catch {
    return { success: false, error: "Não deu para guardar o cenário. Tente de novo." };
  }
}

/**
 * Cria o link de visualização, ou troca por um novo (o antigo deixa de funcionar na hora).
 * O código tem 144 bits aleatórios: não dá para adivinhar nem listar.
 */
export async function createTables3DShare(): Promise<Result<{ token: string }>> {
  const ctx = await exigirCasamento("/mesas");
  const refusal = await recusaDeModulo(ctx, "tables3d");
  if (refusal) return { success: false, error: refusal };
  try {
    const token = randomBytes(18).toString("base64url");
    await prisma.wedding.update({ where: { id: ctx.weddingId }, data: { tables3dShareToken: token } });
    revalidatePath("/mesas/3d");
    return { success: true, token };
  } catch {
    return { success: false, error: "Não deu para criar o link. Tente de novo." };
  }
}

export async function disableTables3DShare(): Promise<Result> {
  const ctx = await exigirCasamento("/mesas");
  const refusal = await recusaDeModulo(ctx, "tables3d");
  if (refusal) return { success: false, error: refusal };
  try {
    await prisma.wedding.update({ where: { id: ctx.weddingId }, data: { tables3dShareToken: null } });
    revalidatePath("/mesas/3d");
    return { success: true };
  } catch {
    return { success: false, error: "Não deu para desligar o link. Tente de novo." };
  }
}
