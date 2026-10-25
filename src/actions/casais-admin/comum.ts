// Ações da administração sobre um casal (Casais e Casal): tipos e ajudas (não são ações).
// Toda ação: guard da administração primeiro, zod no servidor, o id da tela só BUSCA o registro, e toda escrita
// vai ao AuditLog com ator, alvo e motivo.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { falhaDeAdminDaPlataforma } from "@/lib/security/platform-admin";

export type ResultadoDaAcaoDoCasal = { success: true; message?: string } | { success: false; error: string };

export const idDoCasamentoValido = z.string().uuid("Casamento inválido.");
export const motivoValido = z.string().trim().min(5, "Conte o motivo em poucas palavras (mínimo de 5 letras).").max(500, "O motivo está longo demais (máximo de 500 letras).");

export function falhar(error: unknown, context: string): ResultadoDaAcaoDoCasal {
  if (error instanceof z.ZodError) return { success: false, error: error.issues[0]?.message ?? "Confira os dados." };
  return falhaDeAdminDaPlataforma(error, context);
}

export function atualizarPaginas(weddingId?: string) {
  revalidatePath("/admin/casais");
  if (weddingId) revalidatePath(`/admin/casais/${weddingId}`);
  revalidatePath("/admin");
}

export function esconderEmailDoCasal(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "o e-mail cadastrado";
  return `${local.slice(0, 2)}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
}
