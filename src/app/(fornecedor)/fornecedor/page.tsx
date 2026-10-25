import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, ExternalLink, Inbox, Lock, MapPin, Users } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { obterContextoDaPaginaDoFornecedor } from "@/lib/security/vendor-guard";
import { LinkPendente } from "@/components/feedback/link-pending";
import { EtiquetaDaSituacaoDoPedido } from "../_components/status-chip";
import { nivelEfetivoDoFornecedor, primeiroNomeDe, formatarTempoRelativo, formatarDataDoCasamento, pedidoEstaBloqueado, ehSituacaoDoPedido, LINK_DO_PLANO, LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL, inicioDoMesEmBrasilia, hojeEmBrasilia, linkDoWhatsapp, type SituacaoDoPedido } from "../_lib/vendor-panel";
import { formatarTelefone } from "@/lib/formatacao/telefone";
import { AcoesDoPedido } from "./lead-actions";
import { CartaoDeResultados, ChamadaDosResultados, type VisitasPorDia } from "./results-card";

import { pluralizar } from "@/lib/formatacao/plural";
export const metadata: Metadata = { title: "Pedidos de orçamento" };

const ESTILO_DO_CARTAO = "rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]";
const ESTILO_DO_SOBRETITULO = "text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase";

const FILTROS: { value: SituacaoDoPedido | null; label: string }[] = [
  { value: null, label: "Todos" },
  { value: "NEW", label: "Novos" },
  { value: "CONTACTED", label: "Respondidos" },
  { value: "PROPOSAL_SENT", label: "Propostas" },
  { value: "CLOSED", label: "Fechados" },
  { value: "DECLINED", label: "Recusados" },
];

const UM_DIA_EM_MS = 86_400_000;
const DIAS_DOS_RESULTADOS = 30;

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { vendor } = await obterContextoDaPaginaDoFornecedor();
  if (!vendor) return null; // o layout explica que a conta ainda não foi vinculada

  const { status: statusParam } = await searchParams;
  const filter = statusParam && ehSituacaoDoPedido(statusParam) ? statusParam : null;
  const monthStart = inicioDoMesEmBrasilia();
  const tier = nivelEfetivoDoFornecedor(vendor.planTier, vendor.planExpiresAt);
  const isFree = tier === "FREE";
  const isMaster = tier === "MASTER";
  // Janela de 30 dias (Brasília): hoje e os 29 dias anteriores.
  const today = hojeEmBrasilia();
  const windowStart = new Date(today.getTime() - (DIAS_DOS_RESULTADOS - 1) * UM_DIA_EM_MS);
  const windowStartInstant = new Date(windowStart.getTime() + 3 * 60 * 60 * 1000); // meia-noite em Brasília

  // Todas as consultas filtram pelo fornecedor da sessão.
  const [leads, monthCount, newCount, closedCount, totalCount, monthLocked, viewRows, windowLeads] = await Promise.all([
    prisma.vendorLead.findMany({
      // "Todos" deixa de fora os recusados (eles ficam no filtro "Recusados").
      where: { vendorId: vendor.id, status: filter ?? { not: "DECLINED" } },
      orderBy: { createdAt: "desc" },
      take: 100,
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
        status: true,
        locked: true,
        createdAt: true,
      },
    }),
    prisma.vendorLead.count({ where: { vendorId: vendor.id, createdAt: { gte: monthStart } } }),
    prisma.vendorLead.count({ where: { vendorId: vendor.id, status: "NEW" } }),
    prisma.vendorLead.count({ where: { vendorId: vendor.id, status: "CLOSED" } }),
    prisma.vendorLead.count({ where: { vendorId: vendor.id } }),
    isFree
      ? prisma.vendorLead.count({ where: { vendorId: vendor.id, locked: true, createdAt: { gte: monthStart } } })
      : Promise.resolve(0),
    prisma.vendorProfileView.findMany({
      where: { vendorId: vendor.id, day: { gte: windowStart } },
      select: { day: true, count: true },
    }),
    isMaster
      ? prisma.vendorLead.count({ where: { vendorId: vendor.id, createdAt: { gte: windowStartInstant } } })
      : Promise.resolve(0),
  ]);

  const views30 = viewRows.reduce((sum, r) => sum + r.count, 0);
  const dailyViews: VisitasPorDia[] = Array.from({ length: DIAS_DOS_RESULTADOS }, (_, i) => {
    const day = new Date(windowStart.getTime() + i * UM_DIA_EM_MS);
    return { day, count: viewRows.find((r) => r.day.getTime() === day.getTime())?.count ?? 0 };
  });

  // Pedido bloqueado (limite do Start): só primeiro nome, data e cidade. Contato e mensagem
  // nem chegam ao HTML.
  const visibleLeads = leads.map((lead) =>
    pedidoEstaBloqueado(lead, tier)
      ? {
          ...lead,
          locked: true as const,
          coupleName: primeiroNomeDe(lead.coupleName),
          couplePhone: "",
          coupleEmail: null,
          message: null,
          guestCount: null,
          meetingType: null,
        }
      : { ...lead, locked: false as const },
  );

  // Novos primeiro, depois os mais recentes.
  const sorted = [...visibleLeads].sort((a, b) => Number(b.status === "NEW") - Number(a.status === "NEW"));
  const used = Math.min(monthCount, LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL);
  const remaining = LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL - used;
  const publicProfileHref = vendor.curationStatus === "APPROVED" ? `/fornecedores/${vendor.id}` : null;

  const kpis = [
    { label: "Pedidos no mês", value: monthCount, hint: `${pluralizar(totalCount, "pedido", "pedidos")} no total` },
    { label: "Sem resposta", value: newCount, hint: newCount > 0 ? "aguardando seu retorno" : totalCount > 0 ? "tudo respondido" : "nenhum pedido ainda" },
    {
      label: "Fechados",
      value: closedCount,
      hint: totalCount > 0 ? `${Math.round((closedCount / totalCount) * 100)}% dos pedidos` : "nenhum ainda",
    },
    {
      label: "Visitas (30 dias)",
      value: views30,
      hint: publicProfileHref ? "no seu perfil público" : "o perfil aparece depois da análise do Aceito",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Aparicao variant="fade" className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className={cn(ESTILO_DO_SOBRETITULO, "hidden md:block")}>Fornecedor</p>
          <h1 className="sr-only font-display text-[40px] leading-[46px] font-medium md:not-sr-only">Pedidos de orçamento</h1>
        </div>
        {publicProfileHref ? (
          <Link
            href={publicProfileHref}
            target="_blank"
            rel="noopener"
            className="hidden min-h-11 items-center gap-2 rounded-xl border border-linha-forte bg-papel px-4 text-[15px] font-semibold text-tinta transition-colors hover:bg-areia md:inline-flex"
          >
            Ver meu perfil público
            <ExternalLink aria-hidden="true" className="size-4" />
            <span className="sr-only">(abre em nova aba)</span>
          </Link>
        ) : null}
      </Aparicao>

      {vendor.curationStatus !== "APPROVED" ? (
        <Aparicao
          variant="up"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-linha bg-papel px-5 py-4"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <strong className="font-semibold">
              {vendor.curationStatus === "REJECTED" ? "O Aceito pediu ajustes no seu perfil" : "Seu perfil está em análise pelo Aceito"}
            </strong>
            <span className="text-sm text-tinta-suave">
              {vendor.curationStatus === "REJECTED"
                ? "Veja o recado, ajuste e salve: o perfil volta para a análise."
                : "Enquanto isso, complete o perfil com fotos, regiões e preço inicial. Perfis completos são aprovados mais rápido e só aparecem para os casais depois disso."}
            </span>
          </div>
          <Link
            href="/fornecedor/perfil"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ameixa px-4 text-[15px] font-semibold text-on-ameixa transition-colors hover:bg-ameixa-hover"
          >
            Completar o perfil
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Aparicao>
      ) : null}

      {isFree ? (
        <Aparicao
          variant="up"
          // No celular a lista de pedidos vem primeiro e o convite ao Pro fecha a página, como no design.
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-salvia-suave px-5 py-4 max-md:order-last"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <strong className="font-semibold">
              {monthLocked > 0
                ? `${pluralizar(monthLocked, "pedido bloqueado", "pedidos bloqueados")} este mês`
                : remaining > 0
                  ? `${used} de ${LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL} pedidos usados este mês`
                  : `Você usou os ${LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL} pedidos do Plano Start este mês`}
            </strong>
            <span className="text-sm text-tinta-suave">
              {monthLocked > 0
                ? `Você usou os ${LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL} pedidos do Plano Start. Assine o Pro para ver o contato desses casais e receber pedidos ilimitados.`
                : remaining > 0
                  ? "No Pro os pedidos são ilimitados e o casal fala com você direto no WhatsApp."
                  : "Os próximos pedidos deste mês chegam bloqueados. No Pro os pedidos são ilimitados."}
            </span>
          </div>
          <Link
            href={LINK_DO_PLANO}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ameixa px-4 text-[15px] font-semibold text-on-ameixa transition-colors hover:bg-ameixa-hover"
          >
            {monthLocked > 0 ? "Desbloquear com o Pro" : "Conhecer o Pro"}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Aparicao>
      ) : null}

      <section aria-label="Resumo" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <Aparicao key={kpi.label} variant="up" delay={80 * (i + 1)} className={cn(ESTILO_DO_CARTAO, "flex flex-col gap-1 p-4 sm:p-5")}>
            <p className={ESTILO_DO_SOBRETITULO}>{kpi.label}</p>
            <span className="font-num text-4xl leading-tight">{kpi.value}</span>
            <span className="text-sm text-tinta-suave">{kpi.hint}</span>
          </Aparicao>
        ))}
      </section>

      <Aparicao variant="up" delay={120} className={cn(!isMaster && "max-md:order-last")}>
        {isMaster ? <CartaoDeResultados days={dailyViews} leads={windowLeads} /> : <ChamadaDosResultados />}
      </Aparicao>

      <section aria-labelledby="lista-pedidos" className="group/lista flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="lista-pedidos" className="text-lg font-semibold">
            {filter ? `Pedidos: ${FILTROS.find((f) => f.value === filter)?.label.toLowerCase()}` : "Todos os pedidos"}
          </h2>
          <nav aria-label="Filtrar pedidos" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <ul className="flex gap-2">
              {FILTROS.map((f) => {
                const active = f.value === filter;
                return (
                  <li key={f.label}>
                    <Link
                      href={f.value ? `/fornecedor?status=${f.value}` : "/fornecedor"}
                      aria-current={active ? "page" : undefined}
                      scroll={false}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors",
                        active
                          ? "border-salvia bg-salvia-suave text-salvia"
                          : "border-linha bg-papel text-tinta-suave hover:border-linha-forte hover:text-tinta",
                      )}
                    >
                      {f.label}
                      {f.value === "NEW" && newCount > 0 ? ` (${newCount})` : ""}
                      <LinkPendente label="Carregando os pedidos" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {sorted.length === 0 ? (
          <Aparicao variant="fade" className={cn(ESTILO_DO_CARTAO, "flex flex-col items-center gap-3 px-6 py-12 text-center")}>
            <span className="grid size-12 place-items-center rounded-full bg-salvia-suave text-salvia">
              <Inbox aria-hidden="true" className="size-6" />
            </span>
            <p className="text-lg font-semibold">
              {filter ? "Nenhum pedido com este status" : "Nenhum pedido por aqui ainda"}
            </p>
            <p className="max-w-md text-tinta-suave">
              Quando um casal pedir orçamento pelo seu perfil, o pedido aparece aqui com os dados do casamento e o
              contato do casal.
            </p>
            <Link
              href="/fornecedor/perfil"
              className="inline-flex min-h-11 items-center rounded-xl border border-linha-forte bg-papel px-4 text-[15px] font-semibold text-tinta transition-colors hover:bg-areia"
            >
              Caprichar no meu perfil
            </Link>
          </Aparicao>
        ) : (
          <ul className="flex flex-col gap-3 transition-opacity group-has-[[data-link-pending]]/lista:opacity-60">
            {sorted.map((lead, i) => {
              const status: SituacaoDoPedido = ehSituacaoDoPedido(lead.status) ? lead.status : "NEW";
              const date = formatarDataDoCasamento(lead.weddingDate);

              if (lead.locked) {
                return (
                  <Aparicao as="li" key={lead.id} variant="up" delay={Math.min(i, 5) * 80}>
                    <article
                      aria-labelledby={`lead-${lead.id}`}
                      className={cn(ESTILO_DO_CARTAO, "relative flex flex-col gap-4 border-dashed bg-areia/40 p-4 sm:flex-row sm:items-center sm:p-6")}
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-areia px-2.5 py-1 text-[13px] leading-4 font-semibold text-tinta">
                          <Lock aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
                          Bloqueado <span className="font-medium">· {formatarTempoRelativo(lead.createdAt)}</span>
                        </span>
                        <h3 id={`lead-${lead.id}`} className="font-display text-2xl leading-tight font-medium break-words">
                          <Link
                            href={`/fornecedor/pedidos/${lead.id}`}
                            className="rounded-sm after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:underline"
                          >
                            {lead.coupleName}
                          </Link>
                        </h3>
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tinta-suave sm:text-base">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays aria-hidden="true" className="size-4" />
                            {date ?? "Data a definir"}
                          </span>
                          {lead.location ? (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin aria-hidden="true" className="size-4" />
                              {lead.location}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-sm text-tinta-suave">
                          Contato e mensagem do casal ficam ocultos: este pedido passou do limite de {LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL} do
                          Plano Start.
                        </p>
                      </div>
                      <div className="relative z-10 w-full sm:w-auto">
                        <Link
                          href={LINK_DO_PLANO}
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-ameixa px-4 text-[15px] font-semibold text-on-ameixa transition-colors hover:bg-ameixa-hover sm:w-56"
                        >
                          <Lock aria-hidden="true" className="size-[18px]" />
                          Desbloquear com o Pro
                        </Link>
                      </div>
                    </article>
                  </Aparicao>
                );
              }

              const details = [
                date ? { icon: CalendarDays, text: date } : null,
                lead.guestCount ? { icon: Users, text: pluralizar(lead.guestCount, "convidado", "convidados") } : null,
              ].filter((d) => d !== null);
              const waText = `Olá, ${lead.coupleName}! Aqui é ${vendor.companyName}, pelo Aceito. Recebi seu pedido de orçamento${date ? ` para ${date}` : ""} e quero conversar com vocês.`;

              return (
                <Aparicao as="li" key={lead.id} variant="up" delay={Math.min(i, 5) * 80}>
                  <article
                    aria-labelledby={`lead-${lead.id}`}
                    className={cn(
                      ESTILO_DO_CARTAO,
                      "relative flex flex-col gap-4 p-4 transition-colors hover:border-linha-forte sm:flex-row sm:items-start sm:p-6",
                      status === "NEW" && "border-2 border-ameixa dark:border-ameixa/55",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <EtiquetaDaSituacaoDoPedido status={status} suffix={formatarTempoRelativo(lead.createdAt)} />
                      <h3 id={`lead-${lead.id}`} className="font-display text-2xl leading-tight font-medium break-words">
                        {/* O link cobre o cartão inteiro; as ações ficam acima dele (z-10). */}
                        <Link
                          href={`/fornecedor/pedidos/${lead.id}`}
                          className="rounded-sm after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:underline"
                        >
                          {lead.coupleName}
                        </Link>
                      </h3>
                      {details.length > 0 || lead.meetingType ? (
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tinta-suave sm:text-base">
                          {details.map(({ icon: Icon, text }) => (
                            <span key={text} className="inline-flex items-center gap-1.5">
                              <Icon aria-hidden="true" className="size-4" />
                              {text}
                            </span>
                          ))}
                          {lead.meetingType ? (
                            <span>{lead.meetingType === "PRESENTIAL" ? "Prefere reunião presencial" : "Prefere reunião online"}</span>
                          ) : null}
                        </p>
                      ) : null}
                      {lead.message ? (
                        <p className="mt-1 text-[15px] whitespace-pre-line break-words sm:text-base">“{lead.message}”</p>
                      ) : null}
                      <p className="mt-1 text-sm text-tinta-suave">
                        {formatarTelefone(lead.couplePhone)}
                        {lead.coupleEmail ? ` · ${lead.coupleEmail}` : ""}
                      </p>
                      <span aria-hidden="true" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-ameixa">
                        Ver pedido completo
                        <ArrowRight className="size-4" />
                      </span>
                    </div>
                    <div className="relative z-10 w-full sm:w-auto">
                      <AcoesDoPedido
                      leadId={lead.id}
                      status={status}
                      coupleName={lead.coupleName}
                      whatsappUrl={linkDoWhatsapp(lead.couplePhone, waText)}
                      coupleEmail={lead.coupleEmail}
                      />
                    </div>
                  </article>
                </Aparicao>
              );
            })}
          </ul>
        )}
        {leads.length === 100 ? (
          <p className="text-center text-sm text-tinta-suave">Mostrando os 100 pedidos mais recentes.</p>
        ) : null}
      </section>
    </div>
  );
}
