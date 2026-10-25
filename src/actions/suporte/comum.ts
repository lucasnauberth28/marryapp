// Suporte e LGPD (administração): tipos de resposta e ajudas das ações (não são ações).
// Cada ação começa pelo guard da administração e grava no AuditLog sem segredos (nunca senha, token ou link;
// e-mails vão mascarados). Os ids vindos da tela só LOCALIZAM o registro.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ERROS } from "@/lib/mensagens-de-erro";

export type Falha = { success: false; error: string; fieldErrors?: Record<string, string> };
export type Sucesso = { success: true; message: string };
export const UM_MINUTO_EM_MS = 60_000;
export const atualizarPaginas = () => revalidatePath("/admin/suporte");

export function falhaDeValidacao(error: z.ZodError): Falha {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
  return { success: false, error: ERROS.camposInvalidos, fieldErrors };
}
