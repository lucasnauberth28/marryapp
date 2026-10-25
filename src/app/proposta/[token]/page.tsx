import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import prisma from "@/lib/prisma";
import { conferirLimiteDeUso, obterIpDoCliente } from "@/lib/security/rate-limiter";
import { SOBRETITULO_DA_PAGINA_COM_TOKEN, MoldeDaPaginaComToken } from "@/components/public/token-page-shell";
import { formatarDataEHoraEmBrasilia, formatarDataDoCasamento, formatarDataDoCasamentoPorExtenso, hojeEmBrasilia } from "@/app/(fornecedor)/_lib/datas-do-painel";
import { PADRAO_DO_TOKEN_PUBLICO } from "@/app/(fornecedor)/_lib/links-publicos";
import { FormularioDeAceiteDaProposta } from "./accept-form";
import { ResumoDaProposta } from "./_proposta/resumo";
import { CartaoDeSituacao, PropostaAceita, PropostaExpirada, PropostaIndisponivel } from "./_proposta/situacao";

export const metadata: Metadata = {
  title: "Proposta",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const LIMITE_DE_VISUALIZACOES = { limit: 60, windowMs: 1000 * 60 * 10 }; // 60 aberturas / 10 min por IP

/** Só o que o casal precisa ver: nada de contato do casal nem dados internos do pedido. */
function buscarProposta(token: string) {
  return prisma.vendorLead.findUnique({
    where: { proposalToken: token },
    select: {
      coupleName: true,
      weddingDate: true,
      location: true,
      status: true,
      locked: true,
      proposalAmount: true,
      proposalDetails: true,
      proposalValidUntil: true,
      proposalSentAt: true,
      proposalAcceptedAt: true,
      proposalAcceptedName: true,
      vendor: { select: { companyName: true, category: true } },
    },
  });
}

function MuitasPropostasAbertas() {
  return (
    <MoldeDaPaginaComToken>
      <CartaoDeSituacao icon={Clock} tone="aviso" title="Muitas tentativas">
        <p>Você abriu muitas propostas em pouco tempo. Tente novamente daqui a alguns minutos.</p>
      </CartaoDeSituacao>
    </MoldeDaPaginaComToken>
  );
}

export default async function PropostaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!PADRAO_DO_TOKEN_PUBLICO.test(token)) notFound();

  const ip = await obterIpDoCliente();
  const rateLimit = await conferirLimiteDeUso({ key: `PROPOSAL_VIEW:${ip}`, ...LIMITE_DE_VISUALIZACOES });
  if (!rateLimit.success) return <MuitasPropostasAbertas />;

  const lead = await buscarProposta(token);
  if (!lead || lead.locked || !lead.proposalSentAt || lead.proposalAmount == null) notFound();

  const expired = !!lead.proposalValidUntil && lead.proposalValidUntil < hojeEmBrasilia();
  const dateLong = formatarDataDoCasamentoPorExtenso(lead.weddingDate);
  const validUntil = formatarDataDoCasamento(lead.proposalValidUntil);

  const nome = lead.vendor.companyName;
  let state: React.ReactNode;
  if (lead.proposalAcceptedAt) state = <PropostaAceita nome={lead.proposalAcceptedName} quando={formatarDataEHoraEmBrasilia(lead.proposalAcceptedAt)} companyName={nome} />;
  else if (lead.status === "DECLINED") state = <PropostaIndisponivel companyName={nome} />;
  else if (expired) state = <PropostaExpirada validUntil={validUntil} companyName={nome} />;
  else state = <FormularioDeAceiteDaProposta token={token} companyName={nome} />;

  return (
    <MoldeDaPaginaComToken>
      <div className="flex flex-col gap-1">
        <p className={SOBRETITULO_DA_PAGINA_COM_TOKEN}>Proposta de {lead.vendor.category.toLowerCase()}</p>
        <h1 className="font-display text-[32px] leading-[38px] font-medium break-words sm:text-[40px] sm:leading-[46px]">
          {lead.vendor.companyName}
        </h1>
        <p className="text-tinta-suave">Para {lead.coupleName}</p>
      </div>

      <ResumoDaProposta amount={lead.proposalAmount} dateLong={dateLong} validUntil={validUntil} expired={expired} location={lead.location} details={lead.proposalDetails} sentAt={lead.proposalSentAt} />

      {state}
    </MoldeDaPaginaComToken>
  );
}
