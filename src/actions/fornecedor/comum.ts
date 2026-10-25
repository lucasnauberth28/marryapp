// Painel do fornecedor: toda escrita é limitada ao fornecedor vinculado à sessão. Ajudas das ações (não são ações).
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import type { FornecedorDoPainel } from "@/lib/security/vendor-guard";
import { nivelEfetivoDoFornecedor, pedidoEstaBloqueado } from "@/app/(fornecedor)/_lib/planos-do-fornecedor";

const LIMITE_DO_PAINEL_DO_FORNECEDOR = { limit: 60, windowMs: 1000 * 60 }; // 60 alterações / minuto por conta

export async function limitarUsoDoFornecedor(userId: string) {
  return conferirLimiteDeUso({ key: `VENDOR_PANEL:${userId}`, ...LIMITE_DO_PAINEL_DO_FORNECEDOR });
}

export const ERRO_DE_LIMITE_DE_USO = "Muitas alterações em pouco tempo. Aguarde um instante e tente novamente.";
export const ERRO_DE_BLOQUEIO = "Este pedido está bloqueado pelo limite do Plano Start. Assine o Pro para desbloquear.";

/** Pedido bloqueado pelo limite do Start (considerando o plano em vigor do fornecedor). */
export function bloqueadoPara(vendor: FornecedorDoPainel, lead: { locked: boolean }) {
  return pedidoEstaBloqueado(lead, nivelEfetivoDoFornecedor(vendor.planTier, vendor.planExpiresAt));
}

/** Token público (proposta / avaliação): 24 bytes aleatórios em base64url (32 caracteres). */
export function novoTokenPublico() {
  return randomBytes(24).toString("base64url");
}

export const textoOpcional = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

/** Aceita "6.800", "6800,50" ou "R$ 6.800,00" e devolve centavos. */
export function interpretarReaisEmCentavos(value: string): number | null {
  const cleaned = value.replace(/[R$\s]/g, "");
  if (!cleaned) return null;
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(cleaned)) return NaN;
  const [reais, centavos = "0"] = cleaned.replace(/\./g, "").split(",");
  return Number(reais) * 100 + Number(centavos.padEnd(2, "0"));
}
