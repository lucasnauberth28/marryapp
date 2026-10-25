import { Suspense } from "react";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { RegiaoDeCarregamento } from "@/components/skeletons";
import { CorpoDoPlano } from "./componentes/corpo-do-plano";
import { EsqueletoDoCorpoDoPlano } from "./skeletons";

export const dynamic = "force-dynamic";

export const metadata = { title: "Plano e pagamentos" };

export default async function PlanoPage() {
  // Plano de casal vale para o casamento (os dois do casal), não para a conta
  const { session, weddingId } = await exigirCasamentoNaPagina("/plano");

  // O cabeçalho sai logo; planos, taxas e recibos (várias consultas) entram quando ficam prontos.
  return (
    <div className="flex flex-col gap-7">
      <CabecalhoDaPagina eyebrow="Conta" title="Plano e pagamentos" description="O plano vale para o casamento inteiro. Pagamento único, sem mensalidade." />
      <Suspense
        fallback={
          <RegiaoDeCarregamento label="o plano e os pagamentos" className="flex flex-col gap-7">
            <EsqueletoDoCorpoDoPlano />
          </RegiaoDeCarregamento>
        }
      >
        <CorpoDoPlano userId={session.userId} weddingId={weddingId} />
      </Suspense>
    </div>
  );
}
