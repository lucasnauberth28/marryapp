import { VendorsScreen } from "../_components/vendors-screen";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";
import type { SearchParams } from "@/lib/platform/list-params";

export const metadata = { title: "Curadoria" };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requirePlatformAdminPage();
  return <VendorsScreen searchParams={await searchParams} mode="curadoria" />;
}
