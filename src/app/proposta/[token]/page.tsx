import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarX, CircleX, Clock } from "lucide-react";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { TOKEN_CARD, TOKEN_OVERLINE, TokenPageShell } from "@/components/public/token-page-shell";
import {
  formatBrl,
  formatDateTimeBrasilia,
  formatWeddingDate,
  formatWeddingDateLong,
  PUBLIC_TOKEN_RE,
  todayBrasilia,
} from "@/app/(fornecedor)/_lib/vendor-panel";
import { AcceptProposalForm } from "./accept-form";

export const metadata: Metadata = {
  title: "Proposta",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const VIEW_LIMIT = { limit: 60, windowMs: 1000 * 60 * 10 }; // 60 aberturas / 10 min por IP

function StateCard({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: typeof Clock;
  tone: "sucesso" | "aviso" | "perigo";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      role="status"
      className={cn(
        "flex flex-col gap-2 rounded-2xl p-5 sm:p-6",
        tone === "sucesso" && "bg-sucesso-suave",
        tone === "aviso" && "bg-aviso-suave",
        tone === "perigo" && "bg-perigo-suave",
      )}
    >
      <h2
        className={cn(
          "flex items-center gap-2 text-lg font-semibold",
          tone === "sucesso" && "text-sucesso",
          tone === "aviso" && "text-aviso",
          tone === "perigo" && "text-perigo",
        )}
      >
        <Icon aria-hidden="true" className="size-5 shrink-0" />
        {title}
      </h2>
      <div className="flex flex-col gap-2 text-[15px] text-tinta">{children}</div>
    </section>
  );
}

export default async function PropostaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!PUBLIC_TOKEN_RE.test(token)) notFound();

  const ip = await getClientIp();
  const rateLimit = await checkRateLimit({ key: `PROPOSAL_VIEW:${ip}`, ...VIEW_LIMIT });
  if (!rateLimit.success) {
    return (
      <TokenPageShell>
        <StateCard icon={Clock} tone="aviso" title="Muitas tentativas">
          <p>Você abriu muitas propostas em pouco tempo. Tente novamente daqui a alguns minutos.</p>
        </StateCard>
      </TokenPageShell>
    );
  }

  // Só o que o casal precisa ver: nada de contato do casal nem dados internos do pedido.
  const lead = await prisma.vendorLead.findUnique({
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
  if (!lead || lead.locked || !lead.proposalSentAt || lead.proposalAmount == null) notFound();

  const expired = !!lead.proposalValidUntil && lead.proposalValidUntil < todayBrasilia();
  const dateLong = formatWeddingDateLong(lead.weddingDate);
  const validUntil = formatWeddingDate(lead.proposalValidUntil);

  let state: React.ReactNode;
  if (lead.proposalAcceptedAt) {
    state = (
      <StateCard icon={BadgeCheck} tone="sucesso" title="Proposta aceita">
        <p>
          Aceita por <strong className="font-semibold">{lead.proposalAcceptedName}</strong> em{" "}
          {formatDateTimeBrasilia(lead.proposalAcceptedAt)}.
        </p>
        <p className="font-semibold">Próximos passos</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>{lead.vendor.companyName} vai entrar em contato para o contrato.</li>
          <li>Combinem a forma de pagamento e os detalhes do dia direto com o fornecedor.</li>
        </ul>
      </StateCard>
    );
  } else if (lead.status === "DECLINED") {
    state = (
      <StateCard icon={CircleX} tone="perigo" title="Proposta indisponível">
        <p>Esta proposta não está mais disponível. Se ainda tiver interesse, fale com {lead.vendor.companyName}.</p>
      </StateCard>
    );
  } else if (expired) {
    state = (
      <StateCard icon={CalendarX} tone="aviso" title="Proposta expirada">
        <p>
          O prazo desta proposta terminou em {validUntil}. Peça a {lead.vendor.companyName} uma proposta atualizada.
        </p>
      </StateCard>
    );
  } else {
    state = <AcceptProposalForm token={token} companyName={lead.vendor.companyName} />;
  }

  return (
    <TokenPageShell>
      <div className="flex flex-col gap-1">
        <p className={TOKEN_OVERLINE}>Proposta de {lead.vendor.category.toLowerCase()}</p>
        <h1 className="font-display text-[32px] leading-[38px] font-medium break-words sm:text-[40px] sm:leading-[46px]">
          {lead.vendor.companyName}
        </h1>
        <p className="text-tinta-suave">Para {lead.coupleName}</p>
      </div>

      <section aria-labelledby="proposta-resumo" className={cn(TOKEN_CARD, "flex flex-col gap-4")}>
        <h2 id="proposta-resumo" className="sr-only">
          Resumo da proposta
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5 sm:col-span-2">
            <dt className={TOKEN_OVERLINE}>Valor</dt>
            <dd className="font-display text-4xl leading-tight">{formatBrl(lead.proposalAmount)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className={TOKEN_OVERLINE}>Data do casamento</dt>
            <dd className="text-[17px] font-semibold">{dateLong ?? "A definir"}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className={TOKEN_OVERLINE}>Validade</dt>
            <dd className={cn("text-[17px] font-semibold", expired && "text-perigo")}>
              {validUntil ? `Até ${validUntil}` : "Sem prazo definido"}
            </dd>
          </div>
          {lead.location ? (
            <div className="flex flex-col gap-0.5 sm:col-span-2">
              <dt className={TOKEN_OVERLINE}>Cidade</dt>
              <dd className="text-[17px] font-semibold">{lead.location}</dd>
            </div>
          ) : null}
        </dl>
        {lead.proposalDetails ? (
          <div className="flex flex-col gap-1.5 border-t border-linha pt-4">
            <p className={TOKEN_OVERLINE}>O que está incluído</p>
            <p className="text-[15px] whitespace-pre-line break-words sm:text-base">{lead.proposalDetails}</p>
          </div>
        ) : null}
        <p className="text-[13px] text-tinta-suave">Enviada {formatDateTimeBrasilia(lead.proposalSentAt)}.</p>
      </section>

      {state}
    </TokenPageShell>
  );
}
