"use server";

// Vitrine pública: pedido de orçamento / reunião com o fornecedor.
import prisma from "@/lib/prisma";
import { z } from "zod";
import { limitarUsoPorIp } from "@/lib/security/rate-limiter";
import { normalizarTexto } from "@/lib/security/sanitize";
import { avisarDepois } from "@/lib/notifications/service";
import { avisarNovoPedidoDeOrcamento } from "@/lib/notifications/events";
import { inicioDoMesEmBrasilia } from "@/app/(fornecedor)/_lib/datas-do-painel";
import { OPCOES_DE_ORCAMENTO_DO_PEDIDO } from "@/app/(fornecedor)/_lib/pedidos";
import { nivelEfetivoDoFornecedor, LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL } from "@/app/(fornecedor)/_lib/planos-do-fornecedor";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import { ERROS } from "@/lib/mensagens-de-erro";

const EsquemaDoPedidoDeOrcamento = z.object({
  vendorId: z.string().uuid(),
  coupleName: z.string().trim().min(3, "Informe seu nome.").max(120),
  couplePhone: z
    .string()
    .transform((v) => somenteDigitos(v))
    .refine((v) => v.length >= 10 && v.length <= 13, "Telefone inválido."),
  coupleEmail: z.string().trim().email("E-mail inválido.").max(200).optional().or(z.literal("")),
  weddingDate: z.coerce.date().optional().nullable(),
  guestCount: z.coerce.number().int().min(0).max(5000).optional().nullable(),
  message: z.string().trim().max(2000).optional(),
  meetingType: z.enum(["ONLINE", "PRESENTIAL"]).optional(),
  location: z.string().trim().max(80, "Use até 80 caracteres na cidade.").optional(),
  budget: z.enum(OPCOES_DE_ORCAMENTO_DO_PEDIDO, { message: "Faixa de orçamento inválida." }).optional().or(z.literal("")),
});

type EntradaDoPedido = z.output<typeof EsquemaDoPedidoDeOrcamento>;

function dadosDoPedido(input: EntradaDoPedido, locked: boolean) {
  return {
    vendorId: input.vendorId,
    coupleName: normalizarTexto(input.coupleName),
    couplePhone: input.couplePhone,
    coupleEmail: input.coupleEmail || null,
    weddingDate: input.weddingDate ?? null,
    guestCount: input.guestCount ?? null,
    message: input.message || null,
    meetingType: input.meetingType || "ONLINE",
    location: input.location ? normalizarTexto(input.location) || null : null,
    budget: input.budget || null,
    locked,
  };
}

/** No plano gratuito, a partir do 4º pedido do mês o pedido chega bloqueado. */
async function pedidoFicaBloqueado(vendor: { id: string; planTier: Parameters<typeof nivelEfetivoDoFornecedor>[0]; planExpiresAt: Date | null }): Promise<boolean> {
  if (nivelEfetivoDoFornecedor(vendor.planTier, vendor.planExpiresAt) !== "FREE") return false;
  const monthCount = await prisma.vendorLead.count({ where: { vendorId: vendor.id, createdAt: { gte: inicioDoMesEmBrasilia() } } });
  return monthCount >= LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL;
}

/**
 * Pública: solicitação de contato / agendamento de reunião com o fornecedor.
 * No Plano Start, a partir do 4º pedido do mês (horário de Brasília) o pedido chega
 * bloqueado: o fornecedor vê só o primeiro nome, a data e a cidade até assinar o Pro.
 * Para o casal, a resposta é a mesma.
 */
export async function criarPedidoDeOrcamento(data: {
  vendorId: string;
  coupleName: string;
  couplePhone: string;
  coupleEmail?: string;
  weddingDate?: Date | null;
  guestCount?: number;
  message?: string;
  meetingType?: string; // "ONLINE" | "PRESENTIAL"
  location?: string; // cidade do casamento
  budget?: string; // uma das LEAD_BUDGET_OPTIONS
}) {
  const parsed = EsquemaDoPedidoDeOrcamento.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const input = parsed.data;

  try {
    const rateLimit = await limitarUsoPorIp("PUBLIC_FORM", `lead:${input.vendorId}`);
    if (!rateLimit.success) {
      return { success: false, error: "Muitas solicitações em pouco tempo. Tente novamente mais tarde." };
    }

    const vendor = await prisma.partnerVendor.findFirst({
      where: { id: input.vendorId, curationStatus: "APPROVED", suspendedAt: null },
      select: { id: true, planTier: true, planExpiresAt: true },
    });
    if (!vendor) return { success: false, error: ERROS.fornecedorNaoEncontrado };

    const locked = await pedidoFicaBloqueado(vendor);

    const lead = await prisma.vendorLead.create({ data: dadosDoPedido(input, locked), select: { id: true, createdAt: true } });

    // Aviso no sino do fornecedor (e push), depois da resposta ao casal
    avisarDepois(() => avisarNovoPedidoDeOrcamento(lead.id));

    return { success: true, lead };
  } catch (error) {
    console.error("[createVendorLead Error]:", error);
    return { success: false, error: "Erro ao solicitar orçamento." };
  }
}
