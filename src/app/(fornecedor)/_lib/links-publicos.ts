import { somenteDigitos } from "@/lib/formatacao/telefone";

/** Link do WhatsApp para um telefone brasileiro (com ou sem 55), com mensagem pronta. */
export function linkDoWhatsapp(phone: string, text?: string): string | null {
  let digits = somenteDigitos(phone);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.length < 12 || digits.length > 13) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Tokens públicos (proposta e avaliação): 24 bytes em base64url. */
export const PADRAO_DO_TOKEN_PUBLICO = /^[A-Za-z0-9_-]{32}$/;

function origemPublica(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? "https://meuaceito.com.br").replace(/\/+$/, "");
}

/** Link que o casal abre para aceitar a proposta. */
export function urlPublicaDaProposta(token: string): string {
  return `${origemPublica()}/proposta/${token}`;
}

/** Link que o casal abre para avaliar o fornecedor. */
export function urlPublicaDaAvaliacao(token: string): string {
  return `${origemPublica()}/avaliar/${token}`;
}
