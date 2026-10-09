import { getVendors } from "@/actions/vendor-actions";
import { getPartnerVendors } from "@/actions/partner-vendor-actions";
import { VendorsClient } from "./vendors-client";
import { requireWeddingPage } from "@/lib/security/wedding-context";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meus fornecedores",
  description: "Gerencie seus contratos e explore fornecedores homologados por região.",
};

export default async function AdminVendorsPage() {
  await requireWeddingPage("/meus-fornecedores");
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
