// Início do casamento (onboarding): validação, tipos e ajudas (não são ações).
import { z } from "zod";
import { normalizarTexto } from "@/lib/security/sanitize";
import { FAIXAS_DE_CONVIDADOS, TEMAS_PRONTOS } from "@/lib/onboarding-options";

const nomeDaPessoa = (label: string) =>
  z
    .string()
    .transform((v) => normalizarTexto(v).replace(/[&+]/g, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(2, `Informe ${label}.`).max(60, `${label[0].toUpperCase()}${label.slice(1)} está longo demais.`));

const CORES_DOS_TEMAS = TEMAS_PRONTOS.map((p) => p.hex) as [string, ...string[]];

export const EsquemaDoInicio = z.object({
  yourName: nomeDaPessoa("o seu nome"),
  partnerName: nomeDaPessoa("o nome de quem vai casar com você"),
  /** "AAAA-MM-DD", ou null quando o casal ainda não tem a data. */
  weddingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .nullable(),
  city: z
    .string()
    .max(80, "Cidade longa demais.")
    .transform((v) => normalizarTexto(v))
    .optional(),
  guestEstimate: z.enum(FAIXAS_DE_CONVIDADOS).nullable().optional(),
  // Cor, cidade e faixa de convidados saíram do onboarding (ficam em Editar o site); seguem aceitos se vierem.
  themeColor: z.enum(CORES_DOS_TEMAS).optional(),
});

export type EntradaDoInicio = z.input<typeof EsquemaDoInicio>;

export type ResultadoDoInicio =
  | { success: true; slug: string; coupleNames: string }
  | { success: false; error: string; redirectTo?: string };

/** "2027-10-11" -> meio-dia em Brasília (evita virar o dia anterior ao exibir). */
export function interpretarDataDoCasamento(value: string | null): Date | null | "invalid" {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 15));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return "invalid";
  const year = new Date().getUTCFullYear();
  if (y < year - 1 || y > year + 10) return "invalid";
  return date;
}

export class ConflitoNoInicio extends Error {}
