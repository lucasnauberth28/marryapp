// Cartões de crédito do casal (usados para escolher "no cartão" ao lançar uma despesa). Sem número completo nem CVV:
// só banco, bandeira, apelido, os 4 últimos dígitos e o limite. Puro: roda na tela, na ação e nos testes.
import { z } from "zod";

export const BANDEIRAS_DE_CARTAO = ["Visa", "Mastercard", "Elo", "American Express", "Hipercard", "Outra"] as const;

/** Cores para reconhecer o cartão na lista (tons escuros e sóbrios). */
export const CORES_DE_CARTAO = ["#18181b", "#5E2B4E", "#1d4ed8", "#0f766e", "#b45309", "#be123c"] as const;

export const MAXIMO_DE_CARTOES_POR_CASAMENTO = 10;

export const EsquemaDoCartao = z.object({
  bank: z.string({ message: "Informe o nome do banco." }).trim().min(2, "Informe o nome do banco.").max(40, "O nome do banco pode ter até 40 letras."),
  brand: z.enum(BANDEIRAS_DE_CARTAO, { message: "Escolha a bandeira." }),
  nickname: z.string().trim().max(30, "O apelido pode ter até 30 letras.").optional().transform((v) => v || null),
  lastDigits: z
    .string()
    .trim()
    .regex(/^(\d{4})?$/, "Informe os 4 últimos dígitos do cartão.")
    .optional()
    .transform((v) => v || null),
  limitCents: z.number({ message: "Informe o limite." }).int("Informe o limite em reais e centavos.").min(0, "Limite inválido.").max(100_000_000, "Limite alto demais."),
  color: z.enum(CORES_DE_CARTAO, { message: "Escolha uma cor da lista." }),
});

export type DadosDoCartao = z.infer<typeof EsquemaDoCartao>;

/** O nome do cartão na lista e nas despesas: "Nubank (Viagem) ****1234". */
export function rotuloDoCartao(c: { bank: string; nickname?: string | null; lastDigits?: string | null }): string {
  return `${c.bank}${c.nickname ? ` (${c.nickname})` : ""}${c.lastDigits ? ` ****${c.lastDigits}` : ""}`;
}
