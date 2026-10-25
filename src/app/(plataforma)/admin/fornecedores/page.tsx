import { VendorsScreen } from "./_components/vendors-screen";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import type { ParametrosDeBusca } from "@/lib/platform/list-params";

export const metadata = { title: "Fornecedores" };

export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  return <VendorsScreen searchParams={await searchParams} mode="lista" />;
}
