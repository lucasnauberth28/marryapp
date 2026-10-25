"use server";

// Convidados: importar lista (planilha lida no navegador; tudo validado de novo aqui).
import { exigirCasamento } from "@/lib/security/wedding-context";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { registrarAuditoria } from "@/lib/audit";
import { TAMANHO_MAXIMO_DA_CATEGORIA, MAXIMO_DE_ACOMPANHANTES, TAMANHO_MAXIMO_DA_RESTRICAO_ALIMENTAR, TAMANHO_MAXIMO_DO_EMAIL, MAXIMO_DE_CONVIDADOS_POR_CASAMENTO, MAXIMO_DE_LINHAS_NA_IMPORTACAO, TAMANHO_MAXIMO_DO_NOME } from "@/lib/importacao-de-convidados/limites";
import { normalizarTelefoneBR } from "@/lib/importacao-de-convidados/linhas";
import { planejarImportacao } from "@/lib/importacao-de-convidados/repetidos";

const EsquemaDoConvidadoImportado = z.object({
  line: z.number().int().min(1).max(1_000_000),
  name: z.string().trim().min(2, "o nome é curto demais").max(TAMANHO_MAXIMO_DO_NOME, "o nome é longo demais"),
  phone: z
    .string()
    .nullable()
    .refine((v) => v === null || (normalizarTelefoneBR(v).ok && /^\d{10,11}$/.test(v)), "o telefone não é válido"),
  email: z.string().trim().email("o e-mail não é válido").max(TAMANHO_MAXIMO_DO_EMAIL).nullable(),
  companions: z.number().int().min(0).max(MAXIMO_DE_ACOMPANHANTES, "são acompanhantes demais"),
  category: z.string().trim().min(1).max(TAMANHO_MAXIMO_DA_CATEGORIA, "o grupo é longo demais").nullable(),
  dietary: z.string().trim().min(1).max(TAMANHO_MAXIMO_DA_RESTRICAO_ALIMENTAR, "a restrição alimentar é longa demais").nullable(),
});

const EsquemaDosConvidadosImportados = z
  .array(EsquemaDoConvidadoImportado)
  .min(1, "Não há nenhum convidado para importar.")
  .max(MAXIMO_DE_LINHAS_NA_IMPORTACAO, `Dá para importar até ${MAXIMO_DE_LINHAS_NA_IMPORTACAO} convidados por vez.`);

type LinhaValida = z.output<typeof EsquemaDoConvidadoImportado> & { problem: null };

/** Mensagem da primeira linha que não passou na validação, com o número da linha da planilha. */
function erroDaValidacao(error: z.ZodError, input: unknown): string {
  const issue = error.issues[0];
  const index = typeof issue.path[0] === "number" ? issue.path[0] : null;
  const line = index !== null && Array.isArray(input) ? (input[index] as { line?: unknown } | undefined)?.line : null;
  return typeof line === "number" ? `A linha ${line} não pode ser importada: ${issue.message}.` : issue.message;
}

/** Grava tudo ou nada, com uma importação por vez em cada casamento (evita duplicar se o botão for tocado duas vezes). */
function gravarImportacao(weddingId: string, rows: LinhaValida[]) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`guest-import:${weddingId}`}))`;

      const existing = await tx.guest.findMany({ where: { weddingId }, select: { name: true, phone: true } });
      const plan = planejarImportacao(rows, existing);

      if (existing.length + plan.toAdd.length > MAXIMO_DE_CONVIDADOS_POR_CASAMENTO) return { tooMany: true as const };
      if (plan.toAdd.length > 0) {
        await tx.guest.createMany({
          data: plan.toAdd.map((r) => ({
            weddingId,
            name: r.name,
            phone: r.phone,
            email: r.email,
            category: r.category,
            allowedCompanions: r.companions,
            dietaryRestrictions: r.dietary,
          })),
        });
      }
      return { tooMany: false as const, added: plan.toAdd.length, duplicates: plan.duplicates.length };
    },
    { timeout: 20_000 },
  );
}

/**
 * Importa convidados de uma planilha. O navegador lê o arquivo e manda só as linhas já
 * normalizadas; aqui tudo é validado de novo, os repetidos (telefone igual a um convidado do
 * casamento, ou o mesmo nome entre quem não tem telefone) são pulados e a gravação é única
 * (tudo ou nada), sempre no casamento da sessão.
 */
export async function importarConvidados(input: unknown) {
  const { weddingId } = await exigirCasamento("/convidados");

  const parsed = EsquemaDosConvidadosImportados.safeParse(input);
  if (!parsed.success) return { success: false as const, error: erroDaValidacao(parsed.error, input) };
  const rows = parsed.data.map((r) => ({ ...r, problem: null }));

  try {
    const result = await gravarImportacao(weddingId, rows);
    if (result.tooMany) {
      return { success: false as const, error: `A lista chegaria a mais de ${MAXIMO_DE_CONVIDADOS_POR_CASAMENTO} convidados, que é o máximo por casamento.` };
    }

    await registrarAuditoria({
      action: "guests.import",
      targetType: "wedding",
      targetId: weddingId,
      details: { received: rows.length, added: result.added, duplicates: result.duplicates },
    });

    revalidatePath("/convidados");
    revalidatePath("/dashboard");
    return { success: true as const, added: result.added, duplicates: result.duplicates };
  } catch (error) {
    console.error("[importGuests]", error);
    return { success: false as const, error: "Não deu para importar agora. Nada foi salvo. Tente de novo." };
  }
}
