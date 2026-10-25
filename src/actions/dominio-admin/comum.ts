// Ações da administração do Aceito sobre os pedidos de domínio: tipos e ajudas (não são ações).
// Só quem tem acesso total ("*") passa. O CPF/CNPJ completo é trocado pela versão escondida na mesma gravação
// que tira o pedido do estado aberto.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import type { ResultadoDaConexao } from "@/lib/dominio/vercel-domains";

type Concluido = { success: true; message?: string };
export type Falha = { success: false; error: string };
export type ResultadoDaAcaoDeAdmin = Concluido | Falha;
export type ResultadoDaAcaoDeConectarDominio = (Concluido & { connection: ResultadoDaConexao }) | Falha;

export const EsquemaDoId = z.string().uuid();
export const NAO_PERMITIDO: Falha = { success: false, error: "Só a administração do Aceito pode fazer isso." };
export const DESATUALIZADO: Falha = { success: false, error: "O pedido mudou enquanto você olhava. Atualize a página." };

/** Só a administração da plataforma (acesso total) passa: o guard único confere a sessão e o perfil no banco. */
export async function somenteAdmin(): Promise<boolean> {
  try {
    await exigirAdminDaPlataforma();
    return true;
  } catch {
    return false;
  }
}

export function atualizarPaginas() {
  revalidatePath("/admin/dominios");
  revalidatePath("/dominios");
  revalidatePath("/dominio");
  revalidatePath("/casamento", "layout");
}

/** "2026-10-12" → meia-noite UTC (datas de calendário, como o resto do app). */
export function interpretarDataDeCalendario(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}
