import { getPartnerVendors } from "@/actions/partner-vendor-actions";
import { PublicVendorsView } from "@/components/public/public-vendors-view";
import { parseIsoDate, toIsoDate, todayBrasilia } from "@/app/(fornecedor)/_lib/vendor-panel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketplace de Fornecedores de Casamento | Aceito",
  description:
    "Encontre os melhores espaços, fotógrafos, buffets e decoradores de casamento na sua região com reuniões online e presenciais.",
};

export default async function PublicVendorsPage({ searchParams }: { searchParams: Promise<{ data?: string | string[] }> }) {
  const { data } = await searchParams;
  const todayIso = toIsoDate(todayBrasilia());
  // Filtro "Data do casamento" (?data=AAAA-MM-DD): datas inválidas ou passadas são ignoradas.
  const raw = typeof data === "string" ? data : undefined;
  const weddingDate = raw && parseIsoDate(raw) && raw >= todayIso ? raw : undefined;

  const partnerVendors = await getPartnerVendors(undefined, { weddingDate });

  return <PublicVendorsView initialPartners={partnerVendors} weddingDate={weddingDate ?? ""} todayIso={todayIso} />;
}
