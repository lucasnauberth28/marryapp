"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ehViolacaoDeUnicidade } from "@/lib/prisma-erros";
import { registrarAuditoria } from "@/lib/audit";
import { PLANOS_ACEITOS_PELO_CUPOM, normalizarCodigoDoCupom } from "@/lib/pagamento/checkout-pricing";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";

type ResultadoDaAcao = { success: true } | { success: false; error: string };

const DESLOCAMENTO_DE_BRASILIA_EM_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3)

/** "2026-12-31" -> fim desse dia no horário de Brasília (o cupom vale o dia inteiro). */
function fimDoDiaEmBrasilia(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) + DESLOCAMENTO_DE_BRASILIA_EM_MS);
}

const EsquemaDosCampos = z
  .object({
    kind: z.enum(["percent", "amount"]),
    /** Percentual (1 a 100) ou valor em centavos. */
    value: z.coerce.number().int("Use um número inteiro.").min(1, "Informe o desconto."),
    planIds: z.array(z.enum(PLANOS_ACEITOS_PELO_CUPOM)).max(PLANOS_ACEITOS_PELO_CUPOM.length).default([]),
    maxRedemptions: z.coerce.number().int().min(1, "O limite de usos precisa ser pelo menos 1.").max(1_000_000).nullable(),
    expiresAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de validade inválida.")
      .nullable(),
    active: z.boolean(),
  })
  .refine((v) => v.kind !== "percent" || v.value <= 100, { message: "O percentual vai de 1 a 100.", path: ["value"] })
  .refine((v) => v.kind !== "amount" || v.value <= 1_000_000, { message: "Desconto alto demais.", path: ["value"] });

export type CamposDoCupom = z.input<typeof EsquemaDosCampos>;

function paraDadosDoBanco(fields: z.output<typeof EsquemaDosCampos>) {
  return {
    percentOff: fields.kind === "percent" ? fields.value : null,
    amountOff: fields.kind === "amount" ? fields.value : null,
    planIds: fields.planIds.length > 0 ? fields.planIds : Prisma.DbNull,
    maxRedemptions: fields.maxRedemptions,
    expiresAt: fields.expiresAt ? fimDoDiaEmBrasilia(fields.expiresAt) : null,
    active: fields.active,
  };
}

function detalhesDaAuditoria(code: string, fields: z.output<typeof EsquemaDosCampos>) {
  return {
    code,
    kind: fields.kind,
    value: fields.value,
    planIds: fields.planIds,
    maxRedemptions: fields.maxRedemptions,
    expiresAt: fields.expiresAt,
    active: fields.active,
  };
}

function falha(error: unknown, context: string): ResultadoDaAcao {
  return falhaDeAdminDaPlataforma(error, context, "Não foi possível salvar agora. Tente de novo.");
}

export async function criarCupom(input: { code: string } & CamposDoCupom): Promise<ResultadoDaAcao> {
  try {
    await exigirAdminDaPlataforma();
    const code = normalizarCodigoDoCupom(input?.code);
    if (!code) return { success: false, error: "O código precisa ter de 3 a 30 letras ou números, sem espaços." };
    const parsed = EsquemaDosCampos.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const created = await prisma.coupon.create({ data: { code, ...paraDadosDoBanco(parsed.data) }, select: { id: true } });
    await registrarAuditoria({ action: "coupon.create", targetType: "coupon", targetId: created.id, details: detalhesDaAuditoria(code, parsed.data) });
    revalidatePath("/admin/planos", "layout");
    return { success: true };
  } catch (error) {
    if (ehViolacaoDeUnicidade(error)) {
      return { success: false, error: "Já existe um cupom com este código." };
    }
    return falha(error, "createCoupon");
  }
}

/** O código não muda depois de criado: ele fica gravado nas cobranças que o usaram. */
export async function atualizarCupom(id: string, input: CamposDoCupom): Promise<ResultadoDaAcao> {
  try {
    await exigirAdminDaPlataforma();
    if (!z.string().uuid().safeParse(id).success) return { success: false, error: "Cupom inválido." };
    const parsed = EsquemaDosCampos.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const coupon = await prisma.coupon.findUnique({ where: { id }, select: { code: true } });
    if (!coupon) return { success: false, error: "Cupom não encontrado. Atualize a página." };
    await prisma.coupon.update({ where: { id }, data: paraDadosDoBanco(parsed.data) });
    await registrarAuditoria({ action: "coupon.update", targetType: "coupon", targetId: id, details: detalhesDaAuditoria(coupon.code, parsed.data) });
    revalidatePath("/admin/planos", "layout");
    return { success: true };
  } catch (error) {
    return falha(error, "updateCoupon");
  }
}

/** Excluir não mexe nas cobranças já feitas: elas guardam o código e o desconto. */
export async function excluirCupom(id: string): Promise<ResultadoDaAcao> {
  try {
    await exigirAdminDaPlataforma();
    if (!z.string().uuid().safeParse(id).success) return { success: false, error: "Cupom inválido." };
    const deleted = await prisma.coupon.delete({ where: { id }, select: { code: true, redemptions: true } }).catch(() => null);
    if (!deleted) return { success: false, error: "Cupom não encontrado. Atualize a página." };
    await registrarAuditoria({
      action: "coupon.delete",
      targetType: "coupon",
      targetId: id,
      details: { code: deleted.code, redemptions: deleted.redemptions },
    });
    revalidatePath("/admin/planos", "layout");
    return { success: true };
  } catch (error) {
    return falha(error, "deleteCoupon");
  }
}
