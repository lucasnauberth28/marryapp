import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, ExternalLink, Inbox, Users } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { getVendorPageContext } from "@/lib/security/vendor-guard";
import { LeadStatusChip } from "../_components/status-chip";
import {
  formatRelative,
  formatWeddingDate,
  formatPhone,
  isLeadStatus,
  PLAN_HREF,
  START_MONTHLY_LEAD_LIMIT,
  startOfMonthBrasilia,
  whatsappHref,
  type LeadStatus,
} from "../_lib/vendor-panel";
import { LeadActions } from "./lead-actions";

export const metadata: Metadata = { title: "Pedidos de orçamento" };

const CARD = "rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]";
const OVERLINE = "text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase";

const FILTERS: { value: LeadStatus | null; label: string }[] = [
  { value: null, label: "Todos" },
  { value: "NEW", label: "Novos" },
  { value: "CONTACTED", label: "Respondidos" },
  { value: "PROPOSAL_SENT", label: "Propostas" },
  { value: "CLOSED", label: "Fechados" },
];

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { vendor } = await getVendorPageContext();
  if (!vendor) return null; // o layout explica que a conta ainda não foi vinculada

  const { status: statusParam } = await searchParams;
  const filter = statusParam && isLeadStatus(statusParam) ? statusParam : null;
  const monthStart = startOfMonthBrasilia();

  // Todas as consultas filtram pelo fornecedor da sessão.
  const [leads, monthCount, newCount, closedCount, totalCount] = await Promise.all([
    prisma.vendorLead.findMany({
      where: { vendorId: vendor.id, ...(filter ? { status: filter } : {}) },
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
        status: true,
        createdAt: true,
      },
    }),
    prisma.vendorLead.count({ where: { vendorId: vendor.id, createdAt: { gte: monthStart } } }),
    prisma.vendorLead.count({ where: { vendorId: vendor.id, status: "NEW" } }),
    prisma.vendorLead.count({ where: { vendorId: vendor.id, status: "CLOSED" } }),
    prisma.vendorLead.count({ where: { vendorId: vendor.id } }),
  ]);

  // Novos primeiro, depois os mais recentes.
  const sorted = [...leads].sort((a, b) => Number(b.status === "NEW") - Number(a.status === "NEW"));
  const isFree = vendor.planTier === "FREE";
  const used = Math.min(monthCount, START_MONTHLY_LEAD_LIMIT);
  const remaining = START_MONTHLY_LEAD_LIMIT - used;
  const publicProfileHref = vendor.curationStatus === "APPROVED" ? `/fornecedores/${vendor.id}` : null;

  const kpis = [
    { label: "Pedidos no mês", value: monthCount, hint: `${plural(totalCount, "pedido", "pedidos")} no total` },
    { label: "Sem resposta", value: newCount, hint: newCount > 0 ? "aguardando seu retorno" : "tudo respondido" },
    {
      label: "Fechados",
      value: closedCount,
      hint: totalCount > 0 ? `${Math.round((closedCount / totalCount) * 100)}% dos pedidos` : "nenhum ainda",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Reveal variant="fade" className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className={cn(OVERLINE, "hidden md:block")}>Fornecedor</p>
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
      </Reveal>

      {isFree ? (
        <Reveal
          variant="up"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-salvia-suave px-5 py-4"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <strong className="font-semibold">
              {remaining > 0
                ? `${used} de ${START_MONTHLY_LEAD_LIMIT} pedidos usados este mês`
                : `Você usou os ${START_MONTHLY_LEAD_LIMIT} pedidos do Plano Start este mês`}
            </strong>
            <span className="text-sm text-tinta-suave">
              No Pro os pedidos são ilimitados e o casal fala com você direto no WhatsApp.
            </span>
          </div>
          <Link
            href={PLAN_HREF}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ameixa px-4 text-[15px] font-semibold text-on-ameixa transition-colors hover:bg-ameixa-hover"
          >
            Conhecer o Pro
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Reveal>
      ) : null}

      <section aria-label="Resumo" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map((kpi, i) => (
          <Reveal key={kpi.label} variant="up" delay={80 * (i + 1)} className={cn(CARD, "flex flex-col gap-1 p-5")}>
            <p className={OVERLINE}>{kpi.label}</p>
            <span className="font-display text-4xl leading-tight">{kpi.value}</span>
            <span className="text-sm text-tinta-suave">{kpi.hint}</span>
          </Reveal>
        ))}
      </section>

      <section aria-labelledby="lista-pedidos" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="lista-pedidos" className="text-lg font-semibold">
            {filter ? `Pedidos: ${FILTERS.find((f) => f.value === filter)?.label.toLowerCase()}` : "Todos os pedidos"}
          </h2>
          <nav aria-label="Filtrar pedidos" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <ul className="flex gap-2">
              {FILTERS.map((f) => {
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
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {sorted.length === 0 ? (
          <Reveal variant="fade" className={cn(CARD, "flex flex-col items-center gap-3 px-6 py-12 text-center")}>
            <span className="grid size-12 place-items-center rounded-full bg-salvia-suave text-salvia">
              <Inbox aria-hidden="true" className="size-6" />
            </span>
            <p className="text-lg font-semibold">
              {filter ? "Nenhum pedido com este status" : "Nenhum pedido por aqui ainda"}
            </p>
            <p className="max-w-md text-tinta-suave">
              Quando um casal pedir orçamento pela sua vitrine, o pedido aparece aqui com os dados do casamento e o
              contato do casal.
            </p>
            <Link
              href="/fornecedor/perfil"
              className="inline-flex min-h-11 items-center rounded-xl border border-linha-forte bg-papel px-4 text-[15px] font-semibold text-tinta transition-colors hover:bg-areia"
            >
              Caprichar no meu perfil
            </Link>
          </Reveal>
        ) : (
          <ul className="flex flex-col gap-3">
            {sorted.map((lead, i) => {
              const status: LeadStatus = isLeadStatus(lead.status) ? lead.status : "NEW";
              const date = formatWeddingDate(lead.weddingDate);
              const details = [
                date ? { icon: CalendarDays, text: date } : null,
                lead.guestCount ? { icon: Users, text: plural(lead.guestCount, "convidado", "convidados") } : null,
              ].filter((d) => d !== null);
              const waText = `Olá, ${lead.coupleName}! Aqui é ${vendor.companyName}, pelo Aceito. Recebi seu pedido de orçamento${date ? ` para ${date}` : ""} e quero conversar com vocês.`;

              return (
                <Reveal as="li" key={lead.id} variant="up" delay={Math.min(i, 5) * 80}>
                  <article
                    aria-labelledby={`lead-${lead.id}`}
                    className={cn(
                      CARD,
                      "flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-6",
                      status === "NEW" && "border-2 border-ameixa",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <LeadStatusChip status={status} suffix={formatRelative(lead.createdAt)} />
                      <h3 id={`lead-${lead.id}`} className="font-display text-2xl leading-tight font-medium break-words">
                        {lead.coupleName}
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
                        {formatPhone(lead.couplePhone)}
                        {lead.coupleEmail ? ` · ${lead.coupleEmail}` : ""}
                      </p>
                    </div>
                    <LeadActions
                      leadId={lead.id}
                      status={status}
                      coupleName={lead.coupleName}
                      whatsappUrl={whatsappHref(lead.couplePhone, waText)}
                      coupleEmail={lead.coupleEmail}
                    />
                  </article>
                </Reveal>
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
