// Quem acabou de confirmar presença no site do casal não precisa digitar nome e WhatsApp de novo no presente.
// O dado fica só no sessionStorage do navegador da própria pessoa (some ao fechar a aba), nunca vai para
// cookie nem para o servidor sozinho: só segue quando a pessoa confirma "sim, sou eu" no checkout.
// Sem dependências: usado no navegador e nos testes.

const SAVED_GUEST_PREFIX = "aceito:convidado:";
/** Quanto tempo o dado vale dentro da mesma aba. */
export const SAVED_GUEST_TTL_MS = 2 * 60 * 60 * 1000;

export interface SavedGuest {
  name: string;
  /** Só os dígitos que a pessoa digitou na confirmação de presença. */
  phone: string;
}

export function savedGuestKey(slug: string) {
  return `${SAVED_GUEST_PREFIX}${slug}`;
}

/** Texto a gravar no sessionStorage; null se nome ou telefone não servirem. */
export function serializeSavedGuest(guest: SavedGuest, now = Date.now()): string | null {
  const name = guest.name.replace(/\s+/g, " ").trim();
  const phone = guest.phone.replace(/\D/g, "");
  if (name.length < 3 || name.length > 120) return null;
  if (phone.length < 10 || phone.length > 13) return null;
  return JSON.stringify({ v: 1, name, phone, savedAt: now });
}

/** Lê o que foi gravado; qualquer coisa fora do formato (ou vencida) vira null. */
export function parseSavedGuest(raw: string | null | undefined, now = Date.now()): SavedGuest | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (data.v !== 1 || typeof data.name !== "string" || typeof data.phone !== "string" || typeof data.savedAt !== "number") return null;
    if (now - data.savedAt > SAVED_GUEST_TTL_MS || data.savedAt > now + 60_000) return null;
    return parseFields(data.name, data.phone);
  } catch {
    return null;
  }
}

function parseFields(name: string, phone: string): SavedGuest | null {
  const n = name.replace(/\s+/g, " ").trim();
  const p = phone.replace(/\D/g, "");
  if (n.length < 3 || n.length > 120 || p.length < 10 || p.length > 13) return null;
  return { name: n, phone: p };
}

/** "final 4321": o telefone inteiro não precisa aparecer na tela. */
export function phoneEnding(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `final ${digits.slice(-4)}` : "";
}
