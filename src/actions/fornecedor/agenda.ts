"use server";

// Painel do fornecedor: compromissos da agenda.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { exigirSessaoDoFornecedor, CAMINHO_DO_PAINEL_DO_FORNECEDOR } from "@/lib/security/vendor-guard";
import { normalizarTexto } from "@/lib/security/sanitize";
import { interpretarDataIso } from "@/app/(fornecedor)/_lib/datas-do-painel";
import { TIPOS_DE_EVENTO_DO_FORNECEDOR } from "@/app/(fornecedor)/_lib/pedidos";
import { ERROS } from "@/lib/mensagens-de-erro";
import { ERRO_DE_BLOQUEIO, ERRO_DE_LIMITE_DE_USO, bloqueadoPara, limitarUsoDoFornecedor, textoOpcional } from "@/actions/fornecedor/comum";

const EsquemaDoEventoDoFornecedor = z
  .object({
    kind: z.enum(TIPOS_DE_EVENTO_DO_FORNECEDOR, { message: "Tipo de compromisso inválido." }),
    date: z.string().transform((v, ctx) => {
      const date = interpretarDataIso(v);
      if (!date || date.getUTCFullYear() < 2000 || date.getUTCFullYear() > 2100) {
        ctx.addIssue({ code: "custom", message: "Escolha uma data válida." });
        return z.NEVER;
      }
      return date;
    }),
    time: z
      .string()
      .optional()
      .transform((v) => v || null)
      .refine((v) => v === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), "Horário inválido."),
    title: textoOpcional(120),
    notes: textoOpcional(1000),
    leadId: z.string().uuid("Pedido inválido.").optional().or(z.literal("")),
  })
  .refine((v) => v.kind !== "MEETING" || v.time !== null, { message: "Informe o horário da reunião.", path: ["time"] });

export type EntradaDoEventoDoFornecedor = {
  kind: string;
  date: string;
  time?: string;
  title?: string;
  notes?: string;
  leadId?: string;
};

type PedidoVinculado = { id: string; coupleName: string };
type Fornecedor = Awaited<ReturnType<typeof exigirSessaoDoFornecedor>>["vendor"];

/** O pedido vinculado precisa ser do próprio fornecedor (e não estar bloqueado pelo Start). */
async function conferirPedidoVinculado(vendor: Fornecedor, leadId: string | undefined): Promise<{ lead: PedidoVinculado | null } | { error: string }> {
  if (!leadId) return { lead: null };
  const found = await prisma.vendorLead.findFirst({ where: { id: leadId, vendorId: vendor.id }, select: { id: true, coupleName: true, locked: true } });
  if (!found) return { error: ERROS.pedidoNaoEncontrado };
  if (bloqueadoPara(vendor, found)) return { error: ERRO_DE_BLOQUEIO };
  return { lead: { id: found.id, coupleName: found.coupleName } };
}

function tituloDoCompromisso(titulo: string | undefined, kind: string, lead: PedidoVinculado | null): string {
  if (titulo) return normalizarTexto(titulo);
  if (kind === "BLOCKED") return "Data bloqueada";
  return lead ? `Reunião com ${lead.coupleName}` : "";
}

export async function criarEventoDoFornecedor(input: EntradaDoEventoDoFornecedor) {
  const { session, vendor } = await exigirSessaoDoFornecedor();

  const parsed = EsquemaDoEventoDoFornecedor.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    const rateLimit = await limitarUsoDoFornecedor(session.userId);
    if (!rateLimit.success) return { success: false, error: ERRO_DE_LIMITE_DE_USO };

    const vinculado = await conferirPedidoVinculado(vendor, data.leadId || undefined);
    if ("error" in vinculado) return { success: false, error: vinculado.error };
    const { lead } = vinculado;

    if (data.kind === "BLOCKED") {
      const already = await prisma.vendorEvent.count({ where: { vendorId: vendor.id, kind: "BLOCKED", date: data.date } });
      if (already > 0) return { success: false, error: "Essa data já está bloqueada." };
    }

    const title = tituloDoCompromisso(data.title, data.kind, lead);
    if (!title) return { success: false, error: "Dê um título para a reunião." };

    await prisma.vendorEvent.create({
      data: {
        vendorId: vendor.id,
        kind: data.kind,
        date: data.date,
        time: data.kind === "MEETING" ? data.time : null,
        title,
        notes: data.notes ? data.notes.replace(/\r\n/g, "\n").trim() : null,
        leadId: lead?.id ?? null,
      },
    });

    revalidatePath(CAMINHO_DO_PAINEL_DO_FORNECEDOR, "layout");
    return { success: true };
  } catch (error) {
    console.error("[createVendorEvent Error]:", error);
    return { success: false, error: "Não deu para salvar o compromisso. Tente de novo." };
  }
}

export async function excluirEventoDoFornecedor(eventId: string) {
  const { session, vendor } = await exigirSessaoDoFornecedor();

  const parsed = z.string().uuid("Compromisso inválido.").safeParse(eventId);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const rateLimit = await limitarUsoDoFornecedor(session.userId);
    if (!rateLimit.success) return { success: false, error: ERRO_DE_LIMITE_DE_USO };

    const result = await prisma.vendorEvent.deleteMany({ where: { id: parsed.data, vendorId: vendor.id } });
    if (result.count === 0) return { success: false, error: "Compromisso não encontrado." };

    revalidatePath(CAMINHO_DO_PAINEL_DO_FORNECEDOR, "layout");
    return { success: true };
  } catch (error) {
    console.error("[deleteVendorEvent Error]:", error);
    return { success: false, error: "Não deu para excluir o compromisso. Tente de novo." };
  }
}
