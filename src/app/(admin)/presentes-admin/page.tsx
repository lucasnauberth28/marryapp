import { Metadata } from "next";
import { obterPresentes } from "@/actions/gift-actions";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { caminhoDoSiteDoCasamento } from "@/lib/casamento/wedding-links";
import { carregarPagamentosDosPresentes, pagamentosParaATela, resumoDosPagamentos } from "./dados-dos-pagamentos";
import { PresentesCliente } from "./presentes-cliente";

export const metadata: Metadata = {
  title: "Presentes em dinheiro",
  description: "Presentes em dinheiro do casamento: o que foi cadastrado e o que já foi recebido",
};

export default async function PresentesAdminPage() {
  const { weddingId, wedding } = await exigirCasamentoNaPagina("/presentes-admin");
  const result = await obterPresentes();
  const rows = await carregarPagamentosDosPresentes(weddingId);

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PresentesCliente
        initialGifts={(result.success ? result.data : []) || []}
        payments={pagamentosParaATela(rows, new Date())}
        siteGiftsHref={caminhoDoSiteDoCasamento(wedding.slug, "presentes")}
        summary={resumoDosPagamentos(rows)}
      />
    </div>
  );
}
