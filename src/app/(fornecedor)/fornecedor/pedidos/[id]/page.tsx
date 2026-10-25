import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obterContextoDaPaginaDoFornecedor } from "@/lib/security/vendor-guard";
import { formatarDataDoCasamento, formatarDataDoCasamentoPorExtenso } from "../../../_lib/datas-do-painel";
import { linkDoWhatsapp } from "../../../_lib/links-publicos";
import { primeiroNomeDe, ehSituacaoDoPedido, type SituacaoDoPedido } from "../../../_lib/pedidos";
import { nivelEfetivoDoFornecedor, pedidoEstaBloqueado } from "../../../_lib/planos-do-fornecedor";
import { situacaoDaAgenda } from "./_detalhe/agenda";
import { CabecalhoDoPedido } from "./_detalhe/cabecalho-do-pedido";
import { BarraFixaDoCelular, CartaoDaProposta } from "./_detalhe/cartao-da-proposta";
import { CartaoDoCasamento } from "./_detalhe/cartao-do-casamento";
import { ColunaLateral } from "./_detalhe/coluna-lateral";
import { carregarContextoDaAgenda, carregarPedido, diaDoCasamento } from "./_detalhe/dados";
import { mensagemDeContato, propostaSalva, rotuloDeChegada } from "./_detalhe/mensagens-e-andamento";
import { PedidoBloqueado } from "./_detalhe/pedido-bloqueado";

export const metadata: Metadata = { title: "Pedido de orçamento" };

const PADRAO_DE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { vendor } = await obterContextoDaPaginaDoFornecedor();
  if (!vendor) return null; // o layout explica que a conta ainda não foi vinculada

  const { id } = await params;
  if (!PADRAO_DE_UUID.test(id)) notFound();
  const lead = await carregarPedido(id, vendor.id); // posse: só pedidos do fornecedor da sessão
  if (!lead) notFound();

  // Limite do Start: pedido bloqueado mostra só primeiro nome, data e cidade (sem contato nem mensagem).
  if (pedidoEstaBloqueado(lead, nivelEfetivoDoFornecedor(vendor.planTier, vendor.planExpiresAt))) {
    return <PedidoBloqueado firstName={primeiroNomeDe(lead.coupleName)} date={formatarDataDoCasamentoPorExtenso(lead.weddingDate)} location={lead.location} arrived={rotuloDeChegada(lead.createdAt)} />;
  }

  const status: SituacaoDoPedido = ehSituacaoDoPedido(lead.status) ? lead.status : "NEW";
  const day = diaDoCasamento(lead.weddingDate);
  const contexto = await carregarContextoDaAgenda(vendor.id, lead.id, day, status);
  const dateShort = formatarDataDoCasamento(lead.weddingDate);
  const contactWa = linkDoWhatsapp(lead.couplePhone, mensagemDeContato(lead, vendor.companyName, dateShort));
  const salva = propostaSalva(lead, vendor.companyName, dateShort);

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDoPedido status={status} createdAt={lead.createdAt} coupleName={lead.coupleName} categoria={vendor.category} avgResponseHours={contexto.avgResponseHours} />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <CartaoDoCasamento lead={lead} dateLong={formatarDataDoCasamentoPorExtenso(lead.weddingDate)} agenda={situacaoDaAgenda(day, status, contexto)} />
          <CartaoDaProposta lead={lead} salva={salva} />
        </div>
        <ColunaLateral lead={lead} status={status} vendor={vendor} contactWa={contactWa} dateShort={dateShort} />
      </div>
      <BarraFixaDoCelular contactWa={contactWa} coupleEmail={lead.coupleEmail} temProposta={Boolean(salva)} />
    </div>
  );
}
