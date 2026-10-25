import { redirecionarParaOCasamentoPrincipal } from "@/lib/casamento/wedding-redirect";

// Endereço antigo (sem casamento): redireciona para /casamento/<slug>/dia-do-evento do casamento principal.
export const dynamic = "force-dynamic";

export default async function DiaDoEventoRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirecionarParaOCasamentoPrincipal("dia-do-evento", await searchParams);
}
