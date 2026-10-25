// Ações da administração em Planos e receita: tipos e ajudas (não são ações).
// Toda ação chama o guard da administração primeiro, valida com zod e grava no AuditLog.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { falhaDeAdminDaPlataforma } from "@/lib/security/platform-admin";

export type ResultadoDaAcaoDePlanos = { success: true; message?: string } | { success: false; error: string };

const primeiroProblema = (error: unknown) => (error instanceof z.ZodError ? (error.issues[0]?.message ?? null) : null);
export const falhar = (error: unknown, context: string): ResultadoDaAcaoDePlanos => {
  const issue = primeiroProblema(error);
  return issue ? { success: false, error: issue } : falhaDeAdminDaPlataforma(error, context);
};

export const TextoValido = (min: number, max: number, minMessage: string) =>
  z.string().transform((v) => v.replace(/\s+/g, " ").trim()).pipe(z.string().min(min, minMessage).max(max, `Use até ${max} letras.`));

export function atualizarPaginas() {
  revalidatePath("/admin/planos", "layout");
  revalidatePath("/admin", "layout");
}
