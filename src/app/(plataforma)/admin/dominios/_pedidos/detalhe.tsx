import { Link2 } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDePlano, EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { ROTULO_DA_SITUACAO, type NomeDaSituacaoDoPedidoDeDominio } from "@/lib/domain-order";
import { formatarTelefone } from "@/lib/formatacao/telefone";
import { formatarData, formatarDataEHora } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { obterDetalheDoDominio, obterResumoDosPedidosDeDominio } from "@/lib/platform/queries/dominios";
import { vercelEstaConfigurada } from "@/lib/vercel-domains";
import { PainelDoDominio } from "../_components/domain-panel";
import { etiquetaDaSituacao } from "./etiquetas";

type Detalhe = NonNullable<Awaited<ReturnType<typeof obterDetalheDoDominio>>>;
type Resumo = Awaited<ReturnType<typeof obterResumoDosPedidosDeDominio>>;

function EtiquetaDoPlano({ planName }: { planName: string | null }) {
  const nome = planName?.toLowerCase();
  if (nome?.includes("vip")) return <EtiquetaDePlano plan="vip" />;
  if (nome?.includes("adaptado")) return <EtiquetaDePlano plan="custom" />;
  return <EtiquetaDeSituacao tone="neutro">Sem assinatura</EtiquetaDeSituacao>;
}

function DadosDoTitular({ detail }: { detail: Detalhe }) {
  return (
    <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
      <dt className="text-tinta-suave">Titular</dt>
      <dd className="text-tinta">{detail.holderName}</dd>
      <dt className="text-tinta-suave">E-mail</dt>
      <dd className="break-all text-tinta">{detail.holderEmail}</dd>
      <dt className="text-tinta-suave">Telefone</dt>
      <dd className="text-tinta">{formatarTelefone(detail.holderPhone)}</dd>
      <dt className="text-tinta-suave">Vence</dt>
      <dd className="text-tinta">{detail.expiresAt ? formatarData(detail.expiresAt) : "Sem data"}</dd>
      {detail.rejectionReason ? (
        <>
          <dt className="text-tinta-suave">Motivo da recusa</dt>
          <dd className="text-tinta">{detail.rejectionReason}</dd>
        </>
      ) : null}
    </dl>
  );
}

function PedidoEscolhido({ detail }: { detail: Detalhe }) {
  return (
    <Painel as="article">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <EtiquetaDoPlano planName={detail.planName} />
        <EtiquetaDeSituacao tone={etiquetaDaSituacao(detail.status).tone}>{ROTULO_DA_SITUACAO[detail.status as NomeDaSituacaoDoPedidoDeDominio] ?? detail.status}</EtiquetaDeSituacao>
      </div>
      <h2 className="mt-3 break-all font-mono text-2xl font-medium leading-8 text-tinta">{detail.domain}</h2>
      <p className="mt-1 text-sm text-tinta-suave">
        {detail.coupleNames} · pedido em {formatarDataEHora(detail.requestedAt)}
        {detail.registeredAt ? ` · registrado em ${formatarData(detail.registeredAt)}` : ""}
      </p>
      <DadosDoTitular detail={detail} />
      <div className="mt-5 border-t border-linha pt-5">
        <PainelDoDominio
          key={detail.id}
          vercelReady={vercelEstaConfigurada()}
          order={{
            id: detail.id,
            domain: detail.domain,
            status: detail.status as NomeDaSituacaoDoPedidoDeDominio,
            holderDocument: detail.holderDocument,
            canRevealDocument: detail.canRevealDocument,
            adminNote: detail.adminNote,
            vercelState: detail.vercelState,
            canRenew: Boolean(detail.expiresAt) && (detail.status === "REGISTERED" || detail.status === "CONNECTED"),
          }}
        />
      </div>
    </Painel>
  );
}

export async function AreaDoDetalheDoDominio({ selectedId, summary }: { selectedId: string | undefined; summary: Resumo }) {
  const detail = selectedId ? await obterDetalheDoDominio(selectedId) : null;
  if (detail) return <PedidoEscolhido detail={detail} />;
  return (
    <Painel>
      <p className="text-sm text-tinta-suave">Escolha um pedido na lista para ver os dados do titular, as etapas e as ações.</p>
      <p className="mt-2 flex items-center gap-2 text-sm text-tinta-suave">
        <Link2 className="size-4" aria-hidden="true" /> {pluralizar(summary.requested + summary.registered, "pedido espera", "pedidos esperam")} uma ação sua.
      </p>
    </Painel>
  );
}
