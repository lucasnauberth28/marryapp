// Convidados: validação do cadastro e ajuda para achar o convite principal (não são ações).
import { z } from "zod";
import prisma from "@/lib/prisma";
import { RsvpStatus } from "@prisma/client";
import { somenteDigitos } from "@/lib/formatacao/telefone";

export const EsquemaDoConvidado = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres.").trim(),
  phone: z
    .unknown()
    .transform((v) => {
      if (!v || typeof v !== "string") return null;
      const clean = somenteDigitos(v);
      return clean || null;
    })
    .refine((val) => !val || val.length >= 10, {
      message: "Telefone inválido (mínimo de 10 dígitos com DDD).",
    }),
  email: z
    .unknown()
    .transform((v) => (typeof v === "string" && v.trim() ? v.trim() : null))
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "E-mail inválido.",
    }),
  category: z
    .unknown()
    .transform((v) => (typeof v === "string" && v.trim() ? v.trim() : null)),
  parentGuestId: z
    .unknown()
    .transform((v) => (typeof v === "string" && v.trim() && v !== "none" ? v.trim() : null)),
  allowedCompanions: z
    .unknown()
    .transform((v) => {
      if (v === null || v === undefined || v === "") return 0;
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    }),
  confirmedCompanions: z
    .unknown()
    .transform((v) => {
      if (v === null || v === undefined || v === "") return 0;
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    }),
  companionsNames: z
    .unknown()
    .transform((v) => (typeof v === "string" && v.trim() ? v.trim() : null)),
  dietaryRestrictions: z
    .unknown()
    .transform((v) => (typeof v === "string" && v.trim() ? v.trim() : null)),
  rsvpStatus: z
    .unknown()
    .transform((v) => (v === "CONFIRMED" || v === "DECLINED" || v === "PENDING" ? (v as RsvpStatus) : undefined)),
});

export async function resolverIdDoConvidadoPrincipal(weddingId: string, parentGuestId: string | null, selfId?: string) {
  if (!parentGuestId || parentGuestId === selfId) return { ok: true as const, value: null };
  const parent = await prisma.guest.findFirst({ where: { id: parentGuestId, weddingId }, select: { id: true } });
  if (!parent) return { ok: false as const, error: "Convidado titular não encontrado." };
  return { ok: true as const, value: parent.id };
}
