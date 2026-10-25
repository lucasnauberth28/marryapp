"use client";
// O endereço personalizado do site: formulário do pedido ou o andamento dele, até o site entrar no ar.
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import type { VisaoDoPedidoDeDominio } from "@/lib/dominio/domain-orders";
import { AndamentoDoPedido } from "./componentes/andamento-do-pedido";
import { AvisoDeRecusa } from "./componentes/aviso-de-recusa";
import { FormularioDoPedido } from "./componentes/formulario-do-pedido";

interface Propriedades {
  coupleNames: string;
  weddingDate: string | null;
  order: VisaoDoPedidoDeDominio | null;
  lastClosed: VisaoDoPedidoDeDominio | null;
  defaults: { name: string; email: string };
}

const DESCRICAO_SEM_PEDIDO =
  "Um endereço só de vocês para o site e os convites, como anaerafael.com.br. Ele é registrado no nome do titular, com o primeiro ano incluído. As renovações seguintes ficam por conta do titular.";

export function DominioCliente({ coupleNames, weddingDate, order, lastClosed, defaults }: Propriedades) {
  return (
    <div className="flex max-w-[880px] flex-col gap-6">
      <CabecalhoDaPagina
        eyebrow="Site e presentes"
        title="Endereço personalizado do site"
        description={order ? "Acompanhem o endereço do site de vocês, do pedido até o dia em que ele entra no ar." : DESCRICAO_SEM_PEDIDO}
      />
      {order ? (
        <AndamentoDoPedido order={order} />
      ) : (
        <>
          {lastClosed?.status === "REJECTED" ? <AvisoDeRecusa order={lastClosed} /> : null}
          <FormularioDoPedido coupleNames={coupleNames} weddingDate={weddingDate} defaults={defaults} />
        </>
      )}
    </div>
  );
}
