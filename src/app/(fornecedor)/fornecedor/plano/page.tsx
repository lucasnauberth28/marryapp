import type { Metadata } from "next";
import { Aparicao } from "@/components/motion/reveal";
import { obterContextoDaPaginaDoFornecedor } from "@/lib/security/vendor-guard";
import { obterCatalogo } from "@/lib/catalog-server";
import { AvisoDeRenovacao, CartaoDoPlanoAtual } from "./_plano/aviso-de-renovacao";
import { carregarPagamentosEPedidos, situacaoDoPlano } from "./_plano/dados";
import { HistoricoDePagamentos } from "./_plano/historico-de-pagamentos";
import { PagamentoDoPlano } from "./plan-checkout";

export const metadata: Metadata = { title: "Plano" };

export default async function PlanoPage() {
  const { session, vendor } = await obterContextoDaPaginaDoFornecedor();
  if (!vendor) return null; // o layout explica que a conta ainda não foi vinculada

  // Página dinâmica (sessão): a data de agora é lida a cada requisição.
  const now = new Date();
  const [catalog, [payments, monthLeads]] = await Promise.all([obterCatalogo(), carregarPagamentosEPedidos(session.userId, vendor.id, now)]);
  const plano = situacaoDoPlano(vendor, catalog, monthLeads, now);
  const avisarRenovacao = plano.daysLeft !== null && plano.daysLeft <= 7 && plano.expiresAt;

  return (
    <div className="flex max-w-[880px] flex-col gap-7">
      <Aparicao variant="fade" className="flex flex-col gap-1">
        <p className="hidden text-xs font-semibold tracking-[0.08em] text-tinta-suave uppercase md:block">Plano</p>
        <h1 className="font-display text-[32px] leading-[38px] md:text-[40px] md:leading-[46px]">Seu plano no Aceito</h1>
      </Aparicao>
      {avisarRenovacao && plano.expiresAt ? <AvisoDeRenovacao planName={plano.planName} daysLeft={plano.daysLeft!} expiresAt={plano.expiresAt} hasActivePeriod={plano.hasActivePeriod} now={now} /> : null}
      <Aparicao>
        <CartaoDoPlanoAtual planName={plano.planName} details={plano.details} />
      </Aparicao>
      <PagamentoDoPlano
        currentTier={vendor.planTier}
        hasActivePeriod={plano.hasActivePeriod}
        daysLeft={plano.hasActivePeriod ? plano.daysLeft : null}
        endLabels={plano.endLabels}
        credits={plano.credits}
        currentPlanName={plano.planName}
        options={plano.options}
      />
      <HistoricoDePagamentos payments={payments} now={now} />
    </div>
  );
}
