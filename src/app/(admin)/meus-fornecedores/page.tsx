import { getVendors } from "@/actions/vendor-actions";
import { VendorsClient } from "./vendors-client";
import { requireWeddingPage } from "@/lib/security/wedding-context";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meus fornecedores",
  description: "Os fornecedores que vocês contrataram e o que ainda falta escolher.",
};

export default async function AdminVendorsPage() {
  await requireWeddingPage("/meus-fornecedores");
  const vendors = await getVendors();

  return (
    <div className="font-sans">
      <VendorsClient initialVendors={vendors} />
    </div>
  );
}
