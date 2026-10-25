import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { obterContextoDaPaginaDoFornecedor } from "@/lib/security/vendor-guard";
import { ehSituacaoDoPedido, nivelEfetivoDoFornecedor } from "../_lib/vendor-panel";
import { AvisoDoPerfilEmAnalise, AvisoDoPlanoInicial } from "./_pedidos/avisos";
import { carregarPedidosDoFornecedor, pedidosVisiveis } from "./_pedidos/dados";
import { ESTILO_DO_SOBRETITULO } from "./_pedidos/estilos";
import { IndicadoresDoFornecedor } from "./_pedidos/indicadores";
import { ListaDePedidos } from "./_pedidos/lista-de-pedidos";
import { CartaoDeResultados, ChamadaDosResultados } from "./_resultados/cartao-de-resultados";

export const metadata: Metadata = { title: "Pedidos de orçamento" };

function CabecalhoDosPedidos({ perfilPublico }: { perfilPublico: string | null }) {
  return (
    <Aparicao variant="fade" className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className={cn(ESTILO_DO_SOBRETITULO, "hidden md:block")}>Fornecedor</p>
        <h1 className="sr-only font-display text-[40px] leading-[46px] font-medium md:not-sr-only">Pedidos de orçamento</h1>
      </div>
      {perfilPublico ? (
        <Link href={perfilPublico} target="_blank" rel="noopener" className="hidden min-h-11 items-center gap-2 rounded-xl border border-linha-forte bg-papel px-4 text-[15px] font-semibold text-tinta transition-colors hover:bg-areia md:inline-flex">
          Ver meu perfil público
          <ExternalLink aria-hidden="true" className="size-4" />
          <span className="sr-only">(abre em nova aba)</span>
        </Link>
      ) : null}
    </Aparicao>
  );
}

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { vendor } = await obterContextoDaPaginaDoFornecedor();
  if (!vendor) return null; // o layout explica que a conta ainda não foi vinculada

  const { status: statusParam } = await searchParams;
  const filter = statusParam && ehSituacaoDoPedido(statusParam) ? statusParam : null;
  const tier = nivelEfetivoDoFornecedor(vendor.planTier, vendor.planExpiresAt);
  const isFree = tier === "FREE";
  const isMaster = tier === "MASTER";
  const d = await carregarPedidosDoFornecedor({ vendorId: vendor.id, filter, isFree, isMaster });
  const perfilPublico = vendor.curationStatus === "APPROVED" ? `/fornecedores/${vendor.id}` : null;

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDosPedidos perfilPublico={perfilPublico} />
      {vendor.curationStatus !== "APPROVED" ? <AvisoDoPerfilEmAnalise rejeitado={vendor.curationStatus === "REJECTED"} /> : null}
      {isFree ? <AvisoDoPlanoInicial monthLocked={d.monthLocked} monthCount={d.monthCount} /> : null}
      <IndicadoresDoFornecedor monthCount={d.monthCount} totalCount={d.totalCount} newCount={d.newCount} closedCount={d.closedCount} views30={d.views30} temPerfilPublico={perfilPublico !== null} />
      <Aparicao variant="up" delay={120} className={cn(!isMaster && "max-md:order-last")}>
        {isMaster ? <CartaoDeResultados days={d.dailyViews} leads={d.windowLeads} /> : <ChamadaDosResultados />}
      </Aparicao>
      <ListaDePedidos pedidos={pedidosVisiveis(d.leads, tier)} filter={filter} newCount={d.newCount} nomeDaEmpresa={vendor.companyName} mostrandoOsMaisRecentes={d.leads.length === 100} />
    </div>
  );
}
