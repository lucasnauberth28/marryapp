import { getVendors } from "@/actions/vendor-actions";
import { getPartnerVendors } from "@/actions/partner-vendor-actions";
import { VendorsClient } from "./vendors-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meus Fornecedores & Contratos | MarryApp",
  description: "Gerencie seus contratos e explore fornecedores homologados por região.",
};

export default async function AdminVendorsPage() {
  const [vendors, partnerVendors] = await Promise.all([
    getVendors(),
    getPartnerVendors(),
  ]);

  return (
    <div className="space-y-6 font-sans">
      <VendorsClient initialVendors={vendors} initialPartners={partnerVendors} />
    </div>
  );
}
