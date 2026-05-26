import { getVendors } from "@/actions/vendor-actions";
import { VendorsClient } from "./vendors-client";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const vendors = await getVendors();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Fornecedores</h2>
        <p className="text-zinc-500 mt-2">Gerencie os contatos e contratos do casamento.</p>
      </div>
      
      <VendorsClient initialVendors={vendors} />
    </div>
  );
}
