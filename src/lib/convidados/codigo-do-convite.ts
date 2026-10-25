// Código do convite digital de um convidado: sem guardar nada no banco, o código leva o id do convidado e uma
// assinatura. Quem não tem o código vê o convite sem nome; um código adulterado não vale.
import { createHmac, timingSafeEqual } from "node:crypto";

const TAMANHO_DA_ASSINATURA = 8;

const ehIdDeConvidado = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

function assinar(idEmHexa: string, segredo: string): Buffer {
  return createHmac("sha256", segredo).update(`convite:${idEmHexa}`).digest().subarray(0, TAMANHO_DA_ASSINATURA);
}

/** Código curto (33 letras e números) do convite de um convidado. */
export function gerarCodigoDoConvite(guestId: string, segredo: string): string | null {
  if (!ehIdDeConvidado(guestId) || segredo.length < 16) return null;
  const hexa = guestId.replace(/-/g, "").toLowerCase();
  return `${Buffer.from(hexa, "hex").toString("base64url")}${assinar(hexa, segredo).toString("base64url")}`;
}

/** O id do convidado de um código válido; null para código vazio, adulterado ou de outro segredo. */
export function lerCodigoDoConvite(codigo: unknown, segredo: string): string | null {
  if (typeof codigo !== "string" || !/^[A-Za-z0-9_-]{33}$/.test(codigo) || segredo.length < 16) return null;
  const hexa = Buffer.from(codigo.slice(0, 22), "base64url").toString("hex");
  const recebida = Buffer.from(codigo.slice(22), "base64url");
  const esperada = assinar(hexa, segredo);
  if (hexa.length !== 32 || recebida.length !== esperada.length || !timingSafeEqual(recebida, esperada)) return null;
  return `${hexa.slice(0, 8)}-${hexa.slice(8, 12)}-${hexa.slice(12, 16)}-${hexa.slice(16, 20)}-${hexa.slice(20)}`;
}
