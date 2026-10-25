import { TelaDeFornecedores } from "../_components/vendors-screen";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import type { ParametrosDeBusca } from "@/lib/platform/list-params";

export const metadata = { title: "Curadoria" };

export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina();
  return <TelaDeFornecedores searchParams={await searchParams} mode="curadoria" />;
}
