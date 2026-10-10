// Endereços públicos de cada casamento (sem banco; pode ser usado no cliente).

export type WeddingGuestPage = "rsvp" | "presentes" | "dia-do-evento";

/** "/casamento/<slug>" ou "/casamento/<slug>/rsvp" etc. */
export function weddingSitePath(slug: string, page?: WeddingGuestPage): string {
  const base = `/casamento/${encodeURIComponent(slug)}`;
  return page ? `${base}/${page}` : base;
}

/** Origem pública do app, usada em links enviados por WhatsApp. */
export function publicBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? "https://meuaceito.com.br").replace(/\/+$/, "");
}

/** Link absoluto de uma página do casamento, para mensagens. */
export function weddingSiteUrl(slug: string, page?: WeddingGuestPage): string {
  return `${publicBaseUrl()}${weddingSitePath(slug, page)}`;
}
