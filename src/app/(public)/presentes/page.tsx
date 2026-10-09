import { redirectToPrincipalWedding } from "@/lib/wedding-redirect";

// Endereço antigo (sem casamento): redireciona para /casamento/<slug>/presentes do casamento principal.
export const dynamic = "force-dynamic";

export default async function PresentesRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirectToPrincipalWedding("presentes", await searchParams);
}
