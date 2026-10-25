"use server";

// Painel do fornecedor: dados do perfil público.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { exigirSessaoDoFornecedor, CAMINHO_DO_PAINEL_DO_FORNECEDOR } from "@/lib/security/vendor-guard";
import { normalizarTexto, limparUrl } from "@/lib/security/sanitize";
import { CATEGORIAS_DE_FORNECEDOR } from "@/app/(fornecedor)/_lib/perfil-do-fornecedor";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import { ERRO_DE_LIMITE_DE_USO, interpretarReaisEmCentavos, limitarUsoDoFornecedor, textoOpcional } from "@/actions/fornecedor/comum";

const EsquemaDoPerfilDoFornecedor = z.object({
  companyName: z.string().trim().min(2, "Informe o nome do negócio.").max(120),
  category: z.enum(CATEGORIAS_DE_FORNECEDOR, { message: "Escolha uma categoria." }),
  description: textoOpcional(4000),
  startingPrice: z
    .string()
    .max(30)
    .optional()
    .transform((v, ctx) => {
      const cents = interpretarReaisEmCentavos(v ?? "");
      if (cents !== null && (!Number.isFinite(cents) || cents < 0 || cents > 1_000_000_000)) {
        ctx.addIssue({ code: "custom", message: "Preço inicial inválido. Use, por exemplo, 6.800 ou 6.800,00." });
        return z.NEVER;
      }
      return cents;
    }),
  serviceRegions: z
    .string()
    .max(600)
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(/[,\n;]/)
        .map((r) => normalizarTexto(r))
        .filter(Boolean)
        .slice(0, 20)
        .map((r) => r.slice(0, 80)),
    ),
  whatsapp: z
    .string()
    .optional()
    .transform((v) => somenteDigitos(v))
    .refine((v) => v === "" || (v.length >= 10 && v.length <= 13), "WhatsApp inválido. Inclua o DDD."),
  instagram: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => {
      const handle = (v ?? "")
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/^@/, "")
        .replace(/\/.*$/, "");
      return handle;
    })
    .refine((v) => v === "" || /^[A-Za-z0-9._]{1,30}$/.test(v), "Instagram inválido. Use só o @ do perfil."),
  website: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? limparUrl(v) : null))
    .refine((v) => v === null || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v), "Site inválido."),
});

/** Valores do formulário (texto puro); a validação e a conversão acontecem no servidor. */
export type EntradaDoPerfilDoFornecedor = {
  companyName: string;
  category: string;
  description?: string;
  startingPrice?: string;
  serviceRegions?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
};

export async function atualizarPerfilDoFornecedor(input: EntradaDoPerfilDoFornecedor) {
  const { session, vendor } = await exigirSessaoDoFornecedor();

  const parsed = EsquemaDoPerfilDoFornecedor.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    const rateLimit = await limitarUsoDoFornecedor(session.userId);
    if (!rateLimit.success) return { success: false, error: ERRO_DE_LIMITE_DE_USO };

    await prisma.partnerVendor.update({
      // O id vem da sessão (vínculo do usuário), nunca do cliente.
      where: { id: vendor.id },
      data: {
        companyName: normalizarTexto(data.companyName),
        category: data.category,
        description: data.description ? data.description.replace(/\r\n/g, "\n").trim() : null,
        startingPrice: data.startingPrice,
        serviceRegions: data.serviceRegions.length > 0 ? JSON.stringify(data.serviceRegions) : null,
        whatsapp: data.whatsapp || null,
        instagram: data.instagram ? `@${data.instagram}` : null,
        website: data.website,
        // Perfil recusado volta para a fila da curadoria depois de ajustado.
        ...(vendor.curationStatus === "REJECTED" ? { curationStatus: "PENDING_APPROVAL" } : {}),
      },
    });

    revalidatePath(CAMINHO_DO_PAINEL_DO_FORNECEDOR, "layout");
    revalidatePath("/fornecedores");
    revalidatePath(`/fornecedores/${vendor.id}`);
    revalidatePath("/curadoria");

    return { success: true };
  } catch (error) {
    console.error("[updateVendorProfile Error]:", error);
    return { success: false, error: "Não deu para salvar o perfil. Tente de novo." };
  }
}
