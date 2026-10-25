import { obterFornecedoresParceiros } from "@/actions/partner-vendor-actions";
import { VisaoDeFornecedoresPublicos } from "@/components/public/public-vendors-view";
import { parseIsoDate, toIsoDate, todayBrasilia } from "@/app/(fornecedor)/_lib/vendor-panel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fornecedores para o casamento",
  description:
    "Procure espaços, fotógrafos, buffets e decoradores na região do seu casamento, veja o trabalho de cada um e peça orçamento.",
};

export default async function PublicVendorsPage({ searchParams }: { searchParams: Promise<{ data?: string | string[] }> }) {
  const { data } = await searchParams;
  const todayIso = toIsoDate(todayBrasilia());
  // Filtro "Data do casamento" (?data=AAAA-MM-DD): datas inválidas ou passadas são ignoradas.
  const raw = typeof data === "string" ? data : undefined;
  const weddingDate = raw && parseIsoDate(raw) && raw >= todayIso ? raw : undefined;

  const partnerVendors = await obterFornecedoresParceiros(undefined, { weddingDate });

  return <VisaoDeFornecedoresPublicos initialPartners={partnerVendors} weddingDate={weddingDate ?? ""} todayIso={todayIso} />;
}
