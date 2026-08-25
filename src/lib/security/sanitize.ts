/**
 * Sanitização de Entradas de Usuário (Proteção contra XSS e Injeções)
 */

/**
 * Escapa caracteres HTML perigosos de strings de texto livre.
 */
export function sanitizeHtmlText(str: string | null | undefined): string {
  if (!str) return "";

  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

/**
 * Sanitiza e normaliza URLs garantindo que apenas protocolos seguros (http, https, whatsapp) sejam aceitos.
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // Bloqueia tentativas de javascript: ou data:
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null;
  }

  if (/^(https?:\/\/|mailto:|tel:|https:\/\/api\.whatsapp\.com|https:\/\/wa\.me)/i.test(trimmed)) {
    return trimmed;
  }

  // Se for caminho relativo seguro
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

/**
 * Sanitiza identificadores e slugs para URLs seguras.
 */
export function sanitizeSlug(slug: string | null | undefined): string {
  if (!slug) return "";
  return String(slug)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
