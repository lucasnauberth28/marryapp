import { CheckCircle2, Clock } from "lucide-react";
import { Etiqueta, estiloDoCartao, estiloDoTituloDoCartao } from "@/components/casal/ui";
import { ETAPAS_DA_LINHA_DO_TEMPO, ROTULO_DA_SITUACAO, situacoesDasEtapas } from "@/lib/dominio/domain-order";
import type { VisaoDoPedidoDeDominio } from "@/lib/dominio/domain-orders";
import { TEXTO_DOS_TERMOS_DE_DOMINIO } from "@/lib/dominio/domain-terms";
import { cn } from "@/lib/utils";
import { BotaoDeCancelar } from "./botao-de-cancelar";
import { CartaoDoDominioConectado } from "./cartao-do-dominio-conectado";
import { EtapaDaLinhaDoTempo } from "./etapa-da-linha-do-tempo";
import { formatarDataOuVazio } from "./utilitarios";

function Informacao({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-sm font-semibold leading-5 text-tinta-suave">{label}</dt>
      <dd className="min-w-0 break-words text-base leading-6 text-tinta">{children}</dd>
    </div>
  );
}

function LinhaDoTempoDoPedido({ order }: { order: VisaoDoPedidoDeDominio }) {
  const states = situacoesDasEtapas(order.status) ?? [];
  const dates: Record<string, string | null> = {
    REQUESTED: formatarDataOuVazio(order.requestedAt),
    REGISTERING: null,
    REGISTERED: formatarDataOuVazio(order.registeredAt, true),
    CONNECTED: formatarDataOuVazio(order.connectedAt),
  };
  return (
    <ol className="flex flex-col">
      {ETAPAS_DA_LINHA_DO_TEMPO.map((step, index) => (
        <EtapaDaLinhaDoTempo key={step.status} step={step} state={states[index] ?? "todo"} date={dates[step.status]} ultima={index === ETAPAS_DA_LINHA_DO_TEMPO.length - 1} seguinteConcluida={states[index + 1] === "done"} />
      ))}
    </ol>
  );
}

function SituacaoDoPedido({ order }: { order: VisaoDoPedidoDeDominio }) {
  const tom = order.status === "CONNECTED" ? "sucesso" : order.status === "REGISTERED" ? "salvia" : "aviso";
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id="dominio-andamento" className="text-sm text-tinta-suave">
          Seu pedido
        </h2>
        <p className="break-all font-display text-[28px] leading-8 text-tinta sm:text-[32px] sm:leading-9">{order.domain}</p>
      </div>
      <Etiqueta tone={tom} icon={order.status === "CONNECTED" ? CheckCircle2 : Clock}>
        {ROTULO_DA_SITUACAO[order.status]}
      </Etiqueta>
    </div>
  );
}

function TitularDoEndereco({ order }: { order: VisaoDoPedidoDeDominio }) {
  return (
    <section aria-labelledby="dominio-titular-dados" className={cn(estiloDoCartao, "flex flex-col gap-4 p-5 sm:p-6")}>
      <h2 id="dominio-titular-dados" className={estiloDoTituloDoCartao}>
        Titular do endereço
      </h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        <Informacao label="Nome">{order.holderName}</Informacao>
        <Informacao label="CPF ou CNPJ">{order.holderDocumentMasked}</Informacao>
        <Informacao label="E-mail">{order.holderEmail}</Informacao>
        <Informacao label="Telefone">{order.holderPhone}</Informacao>
      </dl>
      <p className="text-sm text-tinta-suave">{TEXTO_DOS_TERMOS_DE_DOMINIO}</p>
      {order.status === "REQUESTED" ? <BotaoDeCancelar /> : null}
    </section>
  );
}

export function AndamentoDoPedido({ order }: { order: VisaoDoPedidoDeDominio }) {
  return (
    <div className="flex flex-col gap-6">
      {order.status === "CONNECTED" ? <CartaoDoDominioConectado domain={order.domain} /> : null}
      <section aria-labelledby="dominio-andamento" className={cn(estiloDoCartao, "flex flex-col gap-5 p-5 sm:p-6")}>
        <SituacaoDoPedido order={order} />
        <LinhaDoTempoDoPedido order={order} />
        {order.expiresAt ? (
          <p className="rounded-xl bg-areia p-4 text-[15px] leading-6 text-tinta">
            O primeiro ano está incluído e o domínio vence em <strong className="font-semibold">{formatarDataOuVazio(order.expiresAt, true)}</strong>.
          </p>
        ) : null}
      </section>
      <TitularDoEndereco order={order} />
    </div>
  );
}
