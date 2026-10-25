"use server";

// Vitrine pública: conferir se o fornecedor está livre na data do casamento.
import prisma from "@/lib/prisma";
import { z } from "zod";
import { conferirLimiteDeUso, obterIpDoCliente } from "@/lib/security/rate-limiter";
import { fornecedorEstaDisponivel } from "@/lib/vendor-availability";
import { hojeEmBrasilia } from "@/app/(fornecedor)/_lib/datas-do-painel";
import { ERROS } from "@/lib/mensagens-de-erro";
import { interpretarDiaDoCasamento } from "@/actions/vitrine/comum";

const LIMITE_DE_CONSULTA_DE_DISPONIBILIDADE = { limit: 30, windowMs: 1000 * 60 * 10 }; // 30 consultas / 10 min por IP

const EsquemaDaDisponibilidade = z.object({
  vendorId: z.string().uuid("Fornecedor inválido."),
  date: z.string().transform((v, ctx) => {
    const day = interpretarDiaDoCasamento(v);
    if (!day) {
      ctx.addIssue({ code: "custom", message: "Escolha uma data válida." });
      return z.NEVER;
    }
    if (day < hojeEmBrasilia()) {
      ctx.addIssue({ code: "custom", message: "Escolha uma data a partir de hoje." });
      return z.NEVER;
    }
    return day;
  }),
});

export type ResultadoDaDisponibilidadeDoFornecedor = { success: true; available: boolean } | { success: false; error: string };

/**
 * Pública: o fornecedor está livre nesta data? Responde só sim/não (sem detalhes da agenda).
 */
export async function conferirDisponibilidadeDoFornecedor(vendorId: string, date: string): Promise<ResultadoDaDisponibilidadeDoFornecedor> {
  const parsed = EsquemaDaDisponibilidade.safeParse({ vendorId, date });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const ip = await obterIpDoCliente();
    const rateLimit = await conferirLimiteDeUso({ key: `VENDOR_AVAILABILITY:${ip}`, ...LIMITE_DE_CONSULTA_DE_DISPONIBILIDADE });
    if (!rateLimit.success) {
      return { success: false, error: "Muitas consultas em pouco tempo. Tente novamente daqui a alguns minutos." };
    }

    const vendor = await prisma.partnerVendor.findFirst({
      where: { id: parsed.data.vendorId, curationStatus: "APPROVED", suspendedAt: null },
      select: { id: true },
    });
    if (!vendor) return { success: false, error: ERROS.fornecedorNaoEncontrado };

    return { success: true, available: await fornecedorEstaDisponivel(vendor.id, parsed.data.date) };
  } catch (error) {
    console.error("[checkVendorAvailability Error]:", error);
    return { success: false, error: "Não foi possível consultar a agenda agora." };
  }
}
