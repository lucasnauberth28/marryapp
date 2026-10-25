import { obterFornecedores } from "@/actions/vendor-actions";
import { VendorsClient } from "./vendors-client";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meus fornecedores",
  description: "Os fornecedores que vocês contrataram e o que ainda falta escolher.",
};

export default async function AdminVendorsPage() {
  await exigirCasamentoNaPagina("/meus-fornecedores");
  const vendors = await obterFornecedores();

  return (
    <div className="font-sans">
      <VendorsClient initialVendors={vendors} />
    </div>
  );
}
