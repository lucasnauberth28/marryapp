import { redirectToPrincipalWedding } from "@/lib/wedding-redirect";

// Endereço antigo (sem casamento): redireciona para /casamento/<slug> do casamento principal.
export const dynamic = "force-dynamic";

export default async function CasamentoRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirectToPrincipalWedding(undefined, await searchParams);
}
