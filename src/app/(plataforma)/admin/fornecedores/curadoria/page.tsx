import { VendorsScreen } from "../_components/vendors-screen";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import type { SearchParams } from "@/lib/platform/list-params";

export const metadata = { title: "Curadoria" };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await exigirAdminDaPlataformaNaPagina();
  return <VendorsScreen searchParams={await searchParams} mode="curadoria" />;
}
