import "server-only";
import { notFound, redirect } from "next/navigation";
import { getPrincipalWedding, getWeddingBySlug } from "@/lib/security/wedding-context";
import { weddingSitePath, type WeddingGuestPage } from "@/lib/wedding-links";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Links antigos sem casamento (/rsvp, /presentes, /dia-do-evento, /casamento) continuam
 * funcionando: levam ao casamento principal, mantendo a query string.
 */
export async function redirectToPrincipalWedding(page: WeddingGuestPage | undefined, searchParams: SearchParams): Promise<never> {
  const wedding = await getPrincipalWedding();
  if (!wedding) notFound();

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) value.forEach((v) => query.append(key, v));
    else if (value !== undefined) query.append(key, value);
  }
  const qs = query.toString();
  redirect(`${weddingSitePath(wedding.slug, page)}${qs ? `?${qs}` : ""}`);
}

/** Páginas /casamento/<slug>/...: o casamento do endereço, ou 404. */
export async function requirePublicWedding(slug: string) {
  const wedding = await getWeddingBySlug(slug);
  if (!wedding) notFound();
  return wedding;
}
