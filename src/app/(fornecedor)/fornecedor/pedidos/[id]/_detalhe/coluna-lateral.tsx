import { Aparicao } from "@/components/motion/reveal";
import { formatarDataEHoraEmBrasilia } from "../../../../_lib/datas-do-painel";
import { urlPublicaDaAvaliacao } from "../../../../_lib/links-publicos";
import { type SituacaoDoPedido } from "../../../../_lib/pedidos";
import { RecusarPedido } from "../decline-lead";
import { PedidoDeAvaliacao } from "../review-request";
import type { PedidoCompleto } from "./dados";
import { CartaoDeAndamento, CartaoDeContato } from "./cartoes-laterais";
import { andamentoDoPedido, mensagemDeRecusa } from "./mensagens-e-andamento";

interface PropriedadesDaColuna {
  lead: PedidoCompleto;
  status: SituacaoDoPedido;
  vendor: { companyName: string };
  contactWa: string | null;
  dateShort: string | null;
}

/** A coluna da direita: contato, andamento, pedido de avaliação (se fechado) e recusa. */
export function ColunaLateral({ lead, status, vendor, contactWa, dateShort }: PropriedadesDaColuna) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <CartaoDeContato lead={lead} contactWa={contactWa} temData={Boolean(dateShort)} />
      <CartaoDeAndamento leadId={lead.id} status={status} passos={andamentoDoPedido(lead, status)} />
      {status === "CLOSED" ? (
        <Aparicao variant="up" delay={240}>
          <PedidoDeAvaliacao
            leadId={lead.id}
            coupleName={lead.coupleName}
            couplePhone={lead.couplePhone}
            companyName={vendor.companyName}
            url={lead.reviewToken ? urlPublicaDaAvaliacao(lead.reviewToken) : null}
            requestedAtLabel={lead.reviewRequestedAt ? formatarDataEHoraEmBrasilia(lead.reviewRequestedAt) : null}
            review={lead.review ? { rating: lead.review.rating, atLabel: formatarDataEHoraEmBrasilia(lead.review.createdAt) } : null}
          />
        </Aparicao>
      ) : null}
      <RecusarPedido
        leadId={lead.id}
        couplePhone={lead.couplePhone}
        defaultMessage={mensagemDeRecusa(lead, vendor.companyName, dateShort)}
        declined={status === "DECLINED" ? { atLabel: lead.declinedAt ? formatarDataEHoraEmBrasilia(lead.declinedAt).replace(/^(\d)/, "em $1") : null, message: lead.declineMessage } : null}
      />
    </div>
  );
}
