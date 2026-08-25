import { getPartnerVendors } from "@/actions/partner-vendor-actions";
import { PublicVendorsView } from "@/components/public/public-vendors-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketplace de Fornecedores de Casamento | MarryApp",
  description:
    "Encontre os melhores espaços, fotógrafos, buffets e decoradores de casamento na sua região com reuniões online e presenciais.",
};

export default async function PublicVendorsPage() {
  const partnerVendors = await getPartnerVendors();

  return <PublicVendorsView initialPartners={partnerVendors} />;
}
