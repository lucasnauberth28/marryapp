"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { COUPON_PLAN_IDS, normalizeCouponCode } from "@/lib/checkout-pricing";
import { AuthorizationError, requirePathPermission } from "@/lib/security/auth-guard";

const ADMIN_PATH = "/assinaturas";

type ActionResult = { success: true } | { success: false; error: string };

const SP_OFFSET_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3)

/** "2026-12-31" -> fim desse dia no horário de Brasília (o cupom vale o dia inteiro). */
function endOfDayBrasilia(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) + SP_OFFSET_MS);
}

const FieldsSchema = z
  .object({
    kind: z.enum(["percent", "amount"]),
    /** Percentual (1 a 100) ou valor em centavos. */
    value: z.coerce.number().int("Use um número inteiro.").min(1, "Informe o desconto."),
    planIds: z.array(z.enum(COUPON_PLAN_IDS)).max(COUPON_PLAN_IDS.length).default([]),
    maxRedemptions: z.coerce.number().int().min(1, "O limite de usos precisa ser pelo menos 1.").max(1_000_000).nullable(),
    expiresAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de validade inválida.")
      .nullable(),
    active: z.boolean(),
  })
  .refine((v) => v.kind !== "percent" || v.value <= 100, { message: "O percentual vai de 1 a 100.", path: ["value"] })
  .refine((v) => v.kind !== "amount" || v.value <= 1_000_000, { message: "Desconto alto demais.", path: ["value"] });

export type CouponFields = z.input<typeof FieldsSchema>;

function toData(fields: z.output<typeof FieldsSchema>) {
  return {
    percentOff: fields.kind === "percent" ? fields.value : null,
    amountOff: fields.kind === "amount" ? fields.value : null,
    planIds: fields.planIds.length > 0 ? fields.planIds : Prisma.DbNull,
    maxRedemptions: fields.maxRedemptions,
    expiresAt: fields.expiresAt ? endOfDayBrasilia(fields.expiresAt) : null,
    active: fields.active,
  };
}

function auditDetails(code: string, fields: z.output<typeof FieldsSchema>) {
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

function failure(error: unknown, context: string): ActionResult {
  if (error instanceof AuthorizationError) return { success: false, error: "Você não tem permissão para mexer em cupons." };
  console.error(`[${context}]`, error);
  return { success: false, error: "Não foi possível salvar agora. Tente de novo." };
}

export async function createCoupon(input: { code: string } & CouponFields): Promise<ActionResult> {
  try {
    await requirePathPermission(ADMIN_PATH);
    const code = normalizeCouponCode(input?.code);
    if (!code) return { success: false, error: "O código precisa ter de 3 a 30 letras ou números, sem espaços." };
    const parsed = FieldsSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const created = await prisma.coupon.create({ data: { code, ...toData(parsed.data) }, select: { id: true } });
    await logAudit({ action: "coupon.create", targetType: "coupon", targetId: created.id, details: auditDetails(code, parsed.data) });
    revalidatePath(ADMIN_PATH);
    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "Já existe um cupom com este código." };
    }
    return failure(error, "createCoupon");
  }
}

/** O código não muda depois de criado: ele fica gravado nas cobranças que o usaram. */
export async function updateCoupon(id: string, input: CouponFields): Promise<ActionResult> {
  try {
    await requirePathPermission(ADMIN_PATH);
    if (!z.string().uuid().safeParse(id).success) return { success: false, error: "Cupom inválido." };
    const parsed = FieldsSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const coupon = await prisma.coupon.findUnique({ where: { id }, select: { code: true } });
    if (!coupon) return { success: false, error: "Cupom não encontrado. Atualize a página." };
    await prisma.coupon.update({ where: { id }, data: toData(parsed.data) });
    await logAudit({ action: "coupon.update", targetType: "coupon", targetId: id, details: auditDetails(coupon.code, parsed.data) });
    revalidatePath(ADMIN_PATH);
    return { success: true };
  } catch (error) {
    return failure(error, "updateCoupon");
  }
}

/** Excluir não mexe nas cobranças já feitas: elas guardam o código e o desconto. */
export async function deleteCoupon(id: string): Promise<ActionResult> {
  try {
    await requirePathPermission(ADMIN_PATH);
    if (!z.string().uuid().safeParse(id).success) return { success: false, error: "Cupom inválido." };
    const deleted = await prisma.coupon.delete({ where: { id }, select: { code: true, redemptions: true } }).catch(() => null);
    if (!deleted) return { success: false, error: "Cupom não encontrado. Atualize a página." };
    await logAudit({
      action: "coupon.delete",
      targetType: "coupon",
      targetId: id,
      details: { code: deleted.code, redemptions: deleted.redemptions },
    });
    revalidatePath(ADMIN_PATH);
    return { success: true };
  } catch (error) {
    return failure(error, "deleteCoupon");
  }
}
