import { getVendors } from "@/actions/vendor-actions";
import { VendorsClient } from "./vendors-client";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const vendors = await getVendors();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#8C6D45] font-serif italic tracking-tight">Fornecedores</h1>
        <p className="text-zinc-500 mt-1">Gerencie os contatos e contratos do casamento.</p>
      </div>
      
      <VendorsClient initialVendors={vendors} />
    </div>
  );
}
