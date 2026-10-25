import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Lock, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { obterContextoDaPaginaDoFornecedor } from "@/lib/security/vendor-guard";
import { EtiquetaDaSituacaoDoPedido } from "../../../_components/status-chip";
import { centavosParaCampoDeReais, nivelEfetivoDoFornecedor, primeiroNomeDe, pedidoEstaBloqueado, LINK_DO_PLANO, urlPublicaDaProposta, urlPublicaDaAvaliacao, LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL, formatarReaisDoPainel, formatarDataEHoraEmBrasilia, formatarTempoRelativo, formatarHoraDoPainel, formatarDataDoCasamento, formatarDataDoCasamentoPorExtenso, ehSituacaoDoPedido, paraDataIso, hojeEmBrasilia, linkDoWhatsapp, type SituacaoDoPedido } from "../../../_lib/vendor-panel";
import { formatarTelefone } from "@/lib/formatacao/telefone";
import { RecusarPedido } from "./decline-lead";
import { FormularioDeProposta, type PropostaSalva } from "./proposal-form";
import { PedidoDeAvaliacao } from "./review-request";
import { SelecaoDeSituacao } from "./status-select";

import { somenteDigitos } from "@/lib/formatacao/telefone";
export const metadata: Metadata = { title: "Pedido de orçamento" };

const ESTILO_DO_CARTAO = "rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-6";
const ESTILO_DO_SOBRETITULO = "text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase";
const ESTILO_DO_BOTAO =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors";
const ESTILO_DO_BOTAO_PRIMARIO = `${ESTILO_DO_BOTAO} bg-ameixa text-on-ameixa hover:bg-ameixa-hover`;
const ESTILO_DO_BOTAO_SECUNDARIO = `${ESTILO_DO_BOTAO} border border-linha-forte bg-papel text-tinta hover:bg-areia`;

const PADRAO_DE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UM_DIA_EM_MS = 86_400_000;

const ORDEM_DAS_SITUACOES: Record<SituacaoDoPedido, number> = { NEW: 0, CONTACTED: 1, PROPOSAL_SENT: 2, CLOSED: 3, DECLINED: -1 };

function colocarEmMaiuscula(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "chegou há 2 h", "chegou ontem", "chegou em 3 out". */
function rotuloDeChegada(date: Date) {
  const rel = formatarTempoRelativo(date);
  return /^(há|ontem|agora)/.test(rel) ? `chegou ${rel}` : `chegou em ${rel}`;
}

function formatarHoras(hours: number) {
  if (hours < 1) return "menos de 1 h";
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} dias`;
}

type SituacaoDaAgenda = { label: string; tone: "sucesso" | "perigo" | "suave"; note?: React.ReactNode };

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { vendor } = await obterContextoDaPaginaDoFornecedor();
  if (!vendor) return null; // o layout explica que a conta ainda não foi vinculada

  const { id } = await params;
  if (!PADRAO_DE_UUID.test(id)) notFound();

  // Posse: só pedidos do fornecedor da sessão.
  const lead = await prisma.vendorLead.findFirst({
    where: { id, vendorId: vendor.id },
    select: {
      id: true,
      coupleName: true,
      couplePhone: true,
      coupleEmail: true,
      weddingDate: true,
      guestCount: true,
      message: true,
      meetingType: true,
      location: true,
      budget: true,
      status: true,
      proposalAmount: true,
      proposalDetails: true,
      proposalValidUntil: true,
      proposalSentAt: true,
      respondedAt: true,
      closedAt: true,
      declinedAt: true,
      declineMessage: true,
      createdAt: true,
      locked: true,
      proposalToken: true,
      proposalAcceptedAt: true,
      proposalAcceptedName: true,
      reviewToken: true,
      reviewRequestedAt: true,
      review: { select: { rating: true, createdAt: true } },
    },
  });
  if (!lead) notFound();

  // Limite do Start: pedido bloqueado mostra só primeiro nome, data e cidade (sem contato nem mensagem).
  if (pedidoEstaBloqueado(lead, nivelEfetivoDoFornecedor(vendor.planTier, vendor.planExpiresAt))) {
    return (
      <PedidoBloqueado
        firstName={primeiroNomeDe(lead.coupleName)}
        date={formatarDataDoCasamentoPorExtenso(lead.weddingDate)}
        location={lead.location}
        arrived={rotuloDeChegada(lead.createdAt)}
      />
    );
  }

  const status: SituacaoDoPedido = ehSituacaoDoPedido(lead.status) ? lead.status : "NEW";
  const day = lead.weddingDate
    ? new Date(Date.UTC(lead.weddingDate.getUTCFullYear(), lead.weddingDate.getUTCMonth(), lead.weddingDate.getUTCDate()))
    : null;

  const [dayEvents, otherWeddings, responded] = await Promise.all([
    day
      ? prisma.vendorEvent.findMany({
          where: { vendorId: vendor.id, date: day },
          orderBy: { time: "asc" },
          select: { kind: true, title: true, time: true },
        })
      : Promise.resolve([]),
    day
      ? prisma.vendorLead.findMany({
          where: {
            vendorId: vendor.id,
            status: "CLOSED",
            id: { not: lead.id },
            weddingDate: { gte: day, lt: new Date(day.getTime() + UM_DIA_EM_MS) },
          },
          select: { id: true, coupleName: true },
          take: 3,
        })
      : Promise.resolve([]),
    status === "NEW"
      ? prisma.vendorLead.findMany({
          where: { vendorId: vendor.id, respondedAt: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { createdAt: true, respondedAt: true },
        })
      : Promise.resolve([]),
  ]);

  const dateShort = formatarDataDoCasamento(lead.weddingDate);
  const dateLong = formatarDataDoCasamentoPorExtenso(lead.weddingDate);

  // "Sua agenda": casamentos fechados e datas bloqueadas ocupam o dia; reuniões, não.
  const blocked = dayEvents.find((e) => e.kind === "BLOCKED");
  const meetings = dayEvents.filter((e) => e.kind === "MEETING");
  let agenda: SituacaoDaAgenda;
  if (!day) {
    agenda = { label: "Sem data definida", tone: "suave" };
  } else if (status === "CLOSED") {
    agenda = { label: "Reservada para este casal", tone: "sucesso" };
  } else if (otherWeddings.length > 0) {
    agenda = {
      label: "Data ocupada",
      tone: "perigo",
      note: (
        <>
          Casamento de{" "}
          {otherWeddings.map((w, i) => (
            <span key={w.id}>
              {i > 0 ? ", " : ""}
              <Link href={`/fornecedor/pedidos/${w.id}`} className="font-semibold text-ameixa underline-offset-2 hover:underline">
                {w.coupleName}
              </Link>
            </span>
          ))}{" "}
          já fechado nesse dia.
        </>
      ),
    };
  } else if (blocked) {
    agenda = { label: "Data ocupada", tone: "perigo", note: `Bloqueada na agenda: ${blocked.title}.` };
  } else {
    agenda = {
      label: "Data livre",
      tone: "sucesso",
      note:
        meetings.length > 0
          ? `Você tem reunião nesse dia${meetings[0].time ? ` às ${formatarHoraDoPainel(meetings[0].time)}` : ""}.`
          : undefined,
    };
  }

  const avgResponseHours =
    responded.length > 0
      ? responded.reduce((sum, l) => sum + (l.respondedAt!.getTime() - l.createdAt.getTime()), 0) / responded.length / 3_600_000
      : null;

  // Mensagens prontas para o WhatsApp do fornecedor.
  const contactText = `Olá, ${lead.coupleName}! Aqui é ${vendor.companyName}, pelo Aceito. Recebi seu pedido de orçamento${dateShort ? ` para ${dateShort}` : ""} e quero conversar com vocês.`;
  const contactWa = linkDoWhatsapp(lead.couplePhone, contactText);

  let savedProposal: PropostaSalva | null = null;
  if (lead.proposalSentAt && lead.proposalAmount != null) {
    const validUntil = formatarDataDoCasamento(lead.proposalValidUntil);
    const publicUrl = lead.proposalToken ? urlPublicaDaProposta(lead.proposalToken) : null;
    const text = [
      `Olá, ${lead.coupleName}! Aqui é ${vendor.companyName}, pelo Aceito. Segue a nossa proposta${dateShort ? ` para o casamento em ${dateShort}` : ""}:`,
      "",
      `Valor: ${formatarReaisDoPainel(lead.proposalAmount)}`,
      ...(validUntil ? [`Válida até: ${validUntil}`] : []),
      ...(lead.proposalDetails ? ["", "O que está incluído:", lead.proposalDetails] : []),
      ...(publicUrl ? ["", "Para ver os detalhes e aceitar a proposta:", publicUrl] : []),
      "",
      "Qualquer dúvida, é só responder por aqui.",
    ].join("\n");
    savedProposal = {
      sentAtLabel: formatarDataEHoraEmBrasilia(lead.proposalSentAt),
      text,
      whatsappUrl: linkDoWhatsapp(lead.couplePhone, text),
      publicUrl,
      accepted:
        lead.proposalAcceptedAt && lead.proposalAcceptedName
          ? { name: lead.proposalAcceptedName, atLabel: formatarDataEHoraEmBrasilia(lead.proposalAcceptedAt) }
          : null,
    };
  }

  const declineDefault = `Olá, ${lead.coupleName}! Obrigado por pensar em ${vendor.companyName} para o casamento de vocês. Infelizmente não vamos conseguir atender ${dateShort ? `no dia ${dateShort}` : "desta vez"}. Desejamos um dia lindo e cheio de amor!`;

  // Andamento: um passo conta como feito pela data gravada ou pelo status atual
  // (pedidos antigos não têm as datas).
  const rank = ORDEM_DAS_SITUACOES[status];
  const steps: { label: string; done: boolean; detail?: string }[] = [
    { label: "Pedido recebido", done: true, detail: `${colocarEmMaiuscula(formatarDataEHoraEmBrasilia(lead.createdAt))} · pelo seu perfil` },
    {
      label: "Respondido",
      done: !!lead.respondedAt || rank >= 1,
      detail: lead.respondedAt ? colocarEmMaiuscula(formatarDataEHoraEmBrasilia(lead.respondedAt)) : "Fale com o casal e marque como respondido",
    },
    {
      label: "Proposta enviada",
      done: !!lead.proposalSentAt || rank >= 2,
      detail: lead.proposalSentAt
        ? `${colocarEmMaiuscula(formatarDataEHoraEmBrasilia(lead.proposalSentAt))}${lead.proposalAmount != null ? ` · ${formatarReaisDoPainel(lead.proposalAmount)}` : ""}`
        : "Registre a proposta neste pedido",
    },
    status === "DECLINED"
      ? {
          label: "Recusado",
          done: true,
          detail: lead.declinedAt ? colocarEmMaiuscula(formatarDataEHoraEmBrasilia(lead.declinedAt)) : undefined,
        }
      : {
          label: "Fechado",
          done: status === "CLOSED",
          detail: lead.closedAt
            ? `${colocarEmMaiuscula(formatarDataEHoraEmBrasilia(lead.closedAt))}${lead.proposalAcceptedAt ? " · aceite digital do casal" : ""}`
            : undefined,
        },
  ];
  // Recusado sem ter passado por uma etapa: a etapa some em vez de ficar pendente.
  const timeline = status === "DECLINED" ? steps.filter((s) => s.done) : steps;

  const facts: { label: string; value: string; wide?: boolean }[] = [
    { label: "Data", value: dateLong ?? "A definir" },
    { label: "Local", value: lead.location ?? "Não informado" },
    { label: "Convidados", value: lead.guestCount ? String(lead.guestCount) : "Não informado" },
    { label: "Orçamento previsto", value: lead.budget ?? "Não informado" },
    {
      label: "Reunião",
      value: lead.meetingType === "PRESENTIAL" ? "Presencial" : lead.meetingType === "ONLINE" ? "Online" : "Sem preferência",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Aparicao variant="fade" className="flex flex-col gap-4">
        <Link
          href="/fornecedor"
          className="-ml-3 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl px-3 text-[15px] font-semibold text-tinta-suave transition-colors hover:bg-areia hover:text-tinta"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Todos os pedidos
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <EtiquetaDaSituacaoDoPedido status={status} suffix={rotuloDeChegada(lead.createdAt)} />
            <h1 className="font-display text-[34px] leading-10 font-medium break-words md:text-[44px] md:leading-[50px]">
              {lead.coupleName}
            </h1>
            <p className="text-tinta-suave">Pedido de orçamento · {vendor.category}</p>
          </div>
          {status === "NEW" ? (
            <p className="max-w-sm text-sm text-tinta-suave">
              Quem responde em até 24 h fecha mais
              {avgResponseHours !== null ? `: sua média é ${formatarHoras(avgResponseHours)}.` : "."}
            </p>
          ) : null}
        </div>
      </Aparicao>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Aparicao variant="up" delay={80}>
            <section aria-labelledby="casamento-titulo" className={cn(ESTILO_DO_CARTAO, "flex flex-col gap-4")}>
              <h2 id="casamento-titulo" className="text-lg font-semibold">
                O casamento
              </h2>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
                {facts.map((f) => (
                  <div key={f.label} className="flex min-w-0 flex-col gap-0.5">
                    <dt className={ESTILO_DO_SOBRETITULO}>{f.label}</dt>
                    <dd className="text-base font-semibold break-words sm:text-[17px]">{f.value}</dd>
                  </div>
                ))}
                <div className="col-span-2 flex min-w-0 flex-col gap-0.5 sm:col-span-1">
                  <dt className={ESTILO_DO_SOBRETITULO}>Sua agenda</dt>
                  <dd
                    className={cn(
                      "text-base font-semibold sm:text-[17px]",
                      agenda.tone === "sucesso" && "text-sucesso",
                      agenda.tone === "perigo" && "text-perigo",
                      agenda.tone === "suave" && "text-tinta-suave",
                    )}
                  >
                    {agenda.label}
                  </dd>
                  {agenda.note ? <dd className="text-sm text-tinta-suave">{agenda.note}</dd> : null}
                </div>
              </dl>
              {lead.message ? (
                <div className="flex flex-col gap-1.5 border-t border-linha pt-4">
                  <p className={ESTILO_DO_SOBRETITULO}>Mensagem do casal</p>
                  <p className="font-display text-[19px] leading-7 whitespace-pre-line break-words sm:text-[22px] sm:leading-8">
                    “{lead.message}”
                  </p>
                </div>
              ) : null}
            </section>
          </Aparicao>

          <Aparicao variant="up" delay={160}>
            <section id="proposta" aria-labelledby="proposta-titulo" className={cn(ESTILO_DO_CARTAO, "flex scroll-mt-20 flex-col gap-4")}>
              <div className="flex flex-col gap-0.5">
                <h2 id="proposta-titulo" className="text-lg font-semibold">
                  {savedProposal?.accepted ? "Proposta aceita" : "Enviar proposta"}
                </h2>
                <p className="text-sm text-tinta-suave">
                  {savedProposal?.accepted
                    ? "O casal aceitou a proposta pelo link. O aceite fica registrado neste pedido."
                    : "A proposta fica registrada neste pedido e abre pronta no seu WhatsApp, com o link para o casal aceitar."}
                </p>
              </div>
              <FormularioDeProposta
                leadId={lead.id}
                todayIso={paraDataIso(hojeEmBrasilia())}
                saved={savedProposal}
                initial={{
                  amount: centavosParaCampoDeReais(lead.proposalAmount),
                  validUntil: lead.proposalValidUntil ? paraDataIso(lead.proposalValidUntil) : "",
                  details: lead.proposalDetails ?? "",
                }}
              />
            </section>
          </Aparicao>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Aparicao variant="up" delay={120}>
            <section aria-labelledby="contato-titulo" className={cn(ESTILO_DO_CARTAO, "flex flex-col gap-3")}>
              <h2 id="contato-titulo" className="text-lg font-semibold">
                Falar com o casal
              </h2>
              {contactWa ? (
                <a href={contactWa} target="_blank" rel="noopener noreferrer" className={cn(ESTILO_DO_BOTAO_PRIMARIO, "w-full")}>
                  <MessageCircle aria-hidden="true" className="size-[18px]" />
                  Responder no WhatsApp
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              ) : null}
              {contactWa ? (
                <p className="text-sm text-tinta-suave">
                  A mensagem já abre com o nome do casal{dateShort ? " e a data" : ""}.
                </p>
              ) : null}
              <ul className="flex flex-col gap-1 text-[15px]">
                <li>
                  <a href={`tel:${somenteDigitos(lead.couplePhone)}`} className="inline-flex min-h-11 items-center underline-offset-2 hover:underline">
                    {formatarTelefone(lead.couplePhone)}
                  </a>
                </li>
                {lead.coupleEmail ? (
                  <li>
                    <a
                      href={`mailto:${lead.coupleEmail}`}
                      className="inline-flex min-h-11 items-center gap-2 break-all text-ameixa underline-offset-2 hover:underline"
                    >
                      <Mail aria-hidden="true" className="size-4 shrink-0" />
                      {lead.coupleEmail}
                    </a>
                  </li>
                ) : null}
              </ul>
            </section>
          </Aparicao>

          <Aparicao variant="up" delay={200}>
            <section aria-labelledby="andamento-titulo" className={cn(ESTILO_DO_CARTAO, "flex flex-col gap-4")}>
              <h2 id="andamento-titulo" className="text-lg font-semibold">
                Andamento
              </h2>
              <SelecaoDeSituacao leadId={lead.id} status={status} />
              <ol className="flex flex-col gap-3.5">
                {timeline.map((step) => (
                  <li key={step.label} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-1.5 size-2.5 shrink-0 rounded-full",
                        step.done ? (step.label === "Recusado" ? "bg-perigo" : "bg-ameixa") : "border-2 border-linha-forte",
                      )}
                    />
                    <span className="flex min-w-0 flex-col">
                      <strong className={cn("text-[15px] font-semibold", !step.done && "text-tinta-suave")}>
                        {step.label}
                        <span className="sr-only">{step.done ? " (concluído)" : " (pendente)"}</span>
                      </strong>
                      {step.detail ? <span className="text-sm text-tinta-suave">{step.detail}</span> : null}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </Aparicao>

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
            defaultMessage={declineDefault}
            declined={
              status === "DECLINED"
                ? {
                    atLabel: lead.declinedAt ? formatarDataEHoraEmBrasilia(lead.declinedAt).replace(/^(\d)/, "em $1") : null,
                    message: lead.declineMessage,
                  }
                : null
            }
          />
        </div>
      </div>

      {/* Celular: ações fixas acima da barra de abas (fora do Reveal, que usa transform). */}
      <div aria-hidden="true" className="h-[68px] md:hidden" />
      <div className="fixed inset-x-0 bottom-20 z-30 grid grid-cols-2 gap-2 border-t border-linha bg-papel px-4 py-3 md:hidden">
        {contactWa ? (
          <a href={contactWa} target="_blank" rel="noopener noreferrer" className={ESTILO_DO_BOTAO_SECUNDARIO}>
            <MessageCircle aria-hidden="true" className="size-[18px]" />
            WhatsApp
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        ) : lead.coupleEmail ? (
          <a href={`mailto:${lead.coupleEmail}`} className={ESTILO_DO_BOTAO_SECUNDARIO}>
            <Mail aria-hidden="true" className="size-[18px]" />
            E-mail
          </a>
        ) : (
          <span />
        )}
        <a href="#proposta" className={ESTILO_DO_BOTAO_PRIMARIO}>
          <Send aria-hidden="true" className="size-[18px]" />
          {savedProposal ? "Ver proposta" : "Enviar proposta"}
        </a>
      </div>
    </div>
  );
}

/** Pedido além do limite do Plano Start: só primeiro nome, data e cidade. */
function PedidoBloqueado({
  firstName,
  date,
  location,
  arrived,
}: {
  firstName: string;
  date: string | null;
  location: string | null;
  arrived: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Aparicao variant="fade" className="flex flex-col gap-4">
        <Link
          href="/fornecedor"
          className="-ml-3 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl px-3 text-[15px] font-semibold text-tinta-suave transition-colors hover:bg-areia hover:text-tinta"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Todos os pedidos
        </Link>
        <div className="flex min-w-0 flex-col gap-2">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-areia px-2.5 py-1 text-[13px] leading-4 font-semibold text-tinta">
            <Lock aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
            Bloqueado <span className="font-medium">· {arrived}</span>
          </span>
          <h1 className="font-display text-[34px] leading-10 font-medium break-words md:text-[44px] md:leading-[50px]">
            {firstName}
          </h1>
        </div>
      </Aparicao>

      <Aparicao variant="up" delay={80}>
        <section aria-labelledby="bloqueado-titulo" className={cn(ESTILO_DO_CARTAO, "flex max-w-2xl flex-col gap-4")}>
          <h2 id="bloqueado-titulo" className="text-lg font-semibold">
            Pedido bloqueado pelo Plano Start
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <dt className={cn(ESTILO_DO_SOBRETITULO, "flex items-center gap-1.5")}>
                <CalendarDays aria-hidden="true" className="size-3.5" />
                Data
              </dt>
              <dd className="text-base font-semibold sm:text-[17px]">{date ?? "A definir"}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className={cn(ESTILO_DO_SOBRETITULO, "flex items-center gap-1.5")}>
                <MapPin aria-hidden="true" className="size-3.5" />
                Cidade
              </dt>
              <dd className="text-base font-semibold sm:text-[17px]">{location ?? "Não informada"}</dd>
            </div>
          </dl>
          <p className="text-tinta-suave">
            Este casal pediu orçamento depois dos {LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL} pedidos do mês do Plano Start. Assine o Pro para
            ver o nome completo, o WhatsApp, o e-mail e a mensagem, e para responder ao pedido.
          </p>
          <Link href={LINK_DO_PLANO} className={cn(ESTILO_DO_BOTAO_PRIMARIO, "w-full sm:w-fit")}>
            <Lock aria-hidden="true" className="size-[18px]" />
            Desbloquear com o Pro
          </Link>
        </section>
      </Aparicao>
    </div>
  );
}
