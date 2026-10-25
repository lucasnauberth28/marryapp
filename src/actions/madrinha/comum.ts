// Administração da Liz: tipos de resposta e ajudas das ações (não são ações).
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ERROS } from "@/lib/mensagens-de-erro";

export type Falha = { success: false; error: string; fieldErrors?: Record<string, string> };
export type Sucesso = { success: true; message: string };

const PAGINAS_PARA_ATUALIZAR = ["/admin/madrinha", "/admin/madrinha/controles"] as const;
export const atualizarPaginas = () => PAGINAS_PARA_ATUALIZAR.forEach((p) => revalidatePath(p));

export const formatoDosLimitesDoPlano = z.object({ perDay: z.string().max(12), perMonth: z.string().max(12), costCap: z.string().max(16), warnPercent: z.string().max(4), autoBlock: z.boolean() });

/** Falha de campo: devolve as mensagens por nome de campo (com prefixo opcional) e uma mensagem geral. */
export function falhaDeCampo(errors: Record<string, string | undefined>, prefix = ""): Falha {
  const fieldErrors: Record<string, string> = {};
  for (const [key, message] of Object.entries(errors)) if (message) fieldErrors[`${prefix}${key}`] = message;
  return { success: false, error: ERROS.camposInvalidos, fieldErrors };
}
