import { redirecionarParaOCasamentoPrincipal } from "@/lib/casamento/wedding-redirect";

// Endereço antigo (sem casamento): redireciona para /casamento/<slug>/rsvp do casamento principal.
export const dynamic = "force-dynamic";

export default async function RsvpRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirecionarParaOCasamentoPrincipal("rsvp", await searchParams);
}
