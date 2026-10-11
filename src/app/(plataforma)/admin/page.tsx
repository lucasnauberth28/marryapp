import Link from "next/link";
import { Activity, AlertTriangle, Bell, Check, CheckCircle2, Clock, Globe, Heart, LifeBuoy, MessageSquare, ShieldCheck, Wallet, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/plataforma/page-header";
import { Panel } from "@/components/plataforma/panel";
import { StatCard, StatGrid } from "@/components/plataforma/stat-card";
import { AttentionList, type AttentionItem } from "@/components/plataforma/attention-list";
import { EmptyState } from "@/components/plataforma/empty-state";
import { RevenueChart } from "@/components/plataforma/revenue-chart";
import { PlanChip, StatusChip } from "@/components/plataforma/status-chip";
import { btn } from "@/components/landing/styles";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";
import { type SearchParams, oneOf } from "@/lib/platform/list-params";
import { formatBRLWhole, formatDayMonth, formatInt, formatLongDate, formatMonthName, formatPercent, plural, relativeDay, timeAgo, formatTime } from "@/lib/platform/format";
import { PERIODS, periodWindows } from "@/lib/platform/overview-period";
import { percentLabel } from "@/lib/platform/revenue";
import { getRevenueByMonth } from "@/lib/platform/queries/receita";
import { getVendorPlansExpiring } from "@/lib/platform/queries/fornecedores";
import { getFunnel, getAttentionItems, getOverviewNumbers, getRecentErrors, getSetupChecklist, getUpcomingWeddings } from "@/lib/platform/queries/atencao";
import { greetingForHour } from "@/lib/wedding-format";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { PeriodSelect } from "./_visao-geral/period-select";

export const metadata = { title: "Visão geral" };

const ICONS = { clock: Clock, alert: AlertTriangle, shield: ShieldCheck, globe: Globe, activity: Activity, life: LifeBuoy, wallet: Wallet, message: MessageSquare } as const;

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const admin = await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" }).format(now)) % 24;
  const greeting = admin.firstName ? `${greetingForHour(hour)}, ${admin.firstName}` : greetingForHour(hour);
  const eyebrow = formatLongDate(now).toLocaleUpperCase("pt-BR");

  const weddingCount = await prisma.wedding.count();
  if (weddingCount === 0) return <EmptyOverview eyebrow={eyebrow} title={greeting} />;

  const period = oneOf(query, "periodo", PERIODS) ?? "30d";
  const win = periodWindows(period, now);
  const [numbers, attention, months, funnel, upcoming, expiring, errors] = await Promise.all([
    getOverviewNumbers(win, now),
    getAttentionItems(now),
    getRevenueByMonth(now, 7),
    getFunnel(win),
    getUpcomingWeddings(now, 5),
    getVendorPlansExpiring(now, 7, 5),
    getRecentErrors(now),
  ]);

  const attentionItems: AttentionItem[] = attention.map((a) => ({ id: a.id, title: a.title, detail: a.detail, tone: a.tone, icon: ICONS[a.icon], actionLabel: a.actionLabel, href: a.href }));
  const revenueTitle = period === "mes" ? `Receita de ${formatMonthName(now)}` : `Receita, ${win.short}`;
  const hasRevenue = months.some((m) => m.total > 0);
  const current = months[months.length - 1];
  const funnelMax = Math.max(1, funnel[0]?.count ?? 0);

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={greeting} description="O que pede a sua decisão hoje e como a plataforma está indo." actions={<PeriodSelect value={period} />} />

      <StatGrid>
        <StatCard
          label={revenueTitle}
          value={formatBRLWhole(numbers.revenue.cents)}
          trend={numbers.revenue.trend === null ? null : { value: numbers.revenue.trend, label: percentLabel(numbers.revenue.trend) }}
          hint={numbers.revenue.payments === 0 ? "nenhum pagamento ainda" : `${period === "mes" ? "até hoje, " : ""}${plural(numbers.revenue.payments, "pagamento", "pagamentos")}`}
          href="/admin/planos"
        />
        <StatCard
          label={`Novos casais, ${win.short}`}
          value={formatInt(numbers.newCouples.count)}
          trend={numbers.newCouples.trend === null ? null : { value: numbers.newCouples.trend, label: percentLabel(numbers.newCouples.trend) }}
          hint={numbers.newCouples.previous > 0 ? `contra ${formatInt(numbers.newCouples.previous)} antes` : "sem período anterior para comparar"}
          href="/admin/casais"
        />
        <StatCard
          label="Casamentos em 30 dias"
          value={formatInt(numbers.next30.count)}
          hint={numbers.next30.count === 0 ? "nenhum nos próximos 30 dias" : numbers.next30.needAttention > 0 ? `${numbers.next30.needAttention} ${numbers.next30.needAttention === 1 ? "pede" : "pedem"} atenção` : "nenhum pede atenção"}
          href="/admin/casais?aba=30dias"
        />
        <StatCard
          label="Esperando curadoria"
          value={formatInt(numbers.curation.count)}
          hint={numbers.curation.oldestAt ? `o mais antigo, ${timeAgo(numbers.curation.oldestAt, now)}` : "ninguém na fila"}
          highlight={numbers.curation.count > 0}
          href="/admin/fornecedores/curadoria"
        />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Panel
          title="Precisa da sua atenção"
          aside={
            attentionItems.length > 0 ? (
              <StatusChip tone="aviso" icon={Bell}>
                {plural(attentionItems.length, "item", "itens")}
              </StatusChip>
            ) : undefined
          }
        >
          {attentionItems.length > 0 ? (
            <AttentionList items={attentionItems} />
          ) : (
            <EmptyState icon={CheckCircle2} compact title="Tudo em dia">
              Pedidos de domínio, Pix para conferir, reembolsos e fornecedores na curadoria aparecem aqui.
            </EmptyState>
          )}
        </Panel>

        <Panel title="Receita por mês">
          {hasRevenue ? (
            <>
              <RevenueChart months={months} />
              <p className="mt-4 text-sm leading-6 text-tinta-suave">
                Em {formatMonthName(now)}, até hoje: casais {formatBRLWhole(current.couple)} e fornecedores {formatBRLWhole(current.vendor)}.
              </p>
            </>
          ) : (
            <EmptyState icon={Wallet} compact title="Ainda sem pagamentos" action={<Link href="/planos" className={`${btn.secondary} ${btn.sm}`}>Ver a página de planos</Link>}>
              Quando chegar o primeiro pagamento, a receita de cada mês aparece aqui.
            </EmptyState>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <Panel title="De cadastro a casal pagante" aside={<span className="text-sm text-tinta-suave">{win.label}</span>}>
          <p className="mb-5 text-tinta">
            <strong>{formatInt(funnel[0].count)}</strong> {funnel[0].count === 1 ? "casal criou" : "casais criaram"} o casamento {win.period === "mes" ? "neste mês" : `nos últimos ${win.short}`}.
          </p>
          {funnel[0].count === 0 ? (
            <p className="text-tinta-suave">Nenhum casamento novo neste período.</p>
          ) : (
            <ol className="flex flex-col gap-4">
              {funnel.map((step, i) => {
                const pct = i === 0 ? null : formatPercent(step.count, funnel[i - 1].count);
                return (
                  <li key={step.key} className="grid grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-[180px_1fr_130px]">
                    <span className="text-tinta">{step.label}</span>
                    <span className="h-3 overflow-hidden rounded-full bg-areia" aria-hidden="true">
                      <span className="block h-full rounded-full bg-ameixa" style={{ width: `${(step.count / funnelMax) * 100}%` }} />
                    </span>
                    <span className="leading-5">
                      <span className="font-semibold tabular-nums text-tinta">{formatInt(step.count)}</span>
                      {pct && <span className="block text-sm text-tinta-suave">{pct} do passo anterior</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>

        <Panel title="Casamentos nos próximos 30 dias" action={numbers.next30.count > 0 ? { label: `Ver os ${numbers.next30.count}`, href: "/admin/casais?aba=30dias" } : undefined}>
          {upcoming.length === 0 ? (
            <EmptyState icon={Heart} compact title="Nenhum casamento nos próximos 30 dias">
              Quando houver datas chegando, os casais aparecem aqui com a situação de cada um.
            </EmptyState>
          ) : (
            <ul className="flex flex-col">
              {upcoming.map((w) => (
                <li key={w.id} className="relative flex items-center gap-4 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
                  <span className="w-12 shrink-0 text-center leading-tight" aria-label={relativeDay(w.weddingDate, now)}>
                    <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">{formatDayMonth(w.weddingDate).split(" ")[1]}</span>
                    <span className="block font-display text-2xl text-tinta">{formatDayMonth(w.weddingDate).split(" ")[0]}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link href={`/admin/casais/${w.id}`} className="font-semibold text-tinta after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa">
                      {w.coupleNames}
                    </Link>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-tinta-suave">
                      {w.city && <span>{w.city}</span>}
                      <PlanChip plan={w.planId} className="min-h-6 px-2 text-xs" />
                    </span>
                  </span>
                  <StatusChip tone={w.status.tone} className="hidden sm:inline-flex">
                    {w.status.label}
                  </StatusChip>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Panel title="Planos de fornecedores vencendo" action={{ label: "Ver todos", href: "/admin/fornecedores?aba=vencendo" }}>
          {expiring.length === 0 ? (
            <p className="text-tinta-suave">Nenhum plano pago vence nos próximos 7 dias.</p>
          ) : (
            <ul className="flex flex-col">
              {expiring.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
                  <span>
                    <span className="block font-semibold text-tinta">{v.companyName}</span>
                    <span className="block text-sm text-tinta-suave">
                      {relativeDay(v.planExpiresAt, now)}, {formatDayMonth(v.planExpiresAt)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <PlanChip plan={v.planTier} />
                    {v.reminderSent ? (
                      <StatusChip tone="neutro" icon={Check}>
                        Aviso enviado
                      </StatusChip>
                    ) : (
                      <StatusChip tone="aviso" icon={Clock}>
                        Aviso pendente
                      </StatusChip>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Erros e falhas nas últimas 24 horas" action={{ label: "Saúde do sistema", href: "/admin/saude" }}>
          {errors.nothingRecorded ? (
            <p className="text-sm leading-6 text-tinta-suave">
              <strong className="font-semibold text-tinta">Sem registros ainda.</strong> Os envios e avisos dos serviços passam a aparecer aqui conforme acontecem. Sem registro não quer dizer que está tudo certo.
            </p>
          ) : (
            <ul className="flex flex-col">
              {errors.services.map((s) => (
                <li key={s.service} className="flex flex-wrap items-center justify-between gap-2 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
                  <span>
                    <span className="block font-semibold text-tinta">{s.label}</span>
                    <span className="block text-sm text-tinta-suave">
                      {s.total === 0 ? "Sem registros nas últimas 24 horas" : s.failures === 0 ? `Nenhuma falha em ${plural(s.total, "registro", "registros")}` : `${plural(s.failures, "falha", "falhas")}${s.lastFailureAt ? `, a última às ${formatTime(s.lastFailureAt)}` : ""}`}
                    </span>
                  </span>
                  {s.total > 0 &&
                    (s.failures > 0 ? (
                      <StatusChip tone="aviso" icon={AlertTriangle}>
                        Atenção
                      </StatusChip>
                    ) : (
                      <StatusChip tone="sucesso" icon={CheckCircle2}>
                        Sem falhas
                      </StatusChip>
                    ))}
                </li>
              ))}
              {errors.failedCrons.map((c) => (
                <li key={c.job} className="flex flex-wrap items-center justify-between gap-2 border-b border-linha py-3 last:border-b-0">
                  <span>
                    <span className="block font-semibold text-tinta">Rotina diária ({c.job})</span>
                    <span className="block text-sm text-tinta-suave">Falhou {timeAgo(c.at, now)}</span>
                  </span>
                  <StatusChip tone="perigo" icon={AlertTriangle}>
                    Falhou
                  </StatusChip>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

/** Versão "Vazia" do desenho: ainda não há nenhum casamento. */
async function EmptyOverview({ eyebrow, title }: { eyebrow: string; title: string }) {
  const checklist = await getSetupChecklist();
  const done = checklist.filter((i) => i.done).length;
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description="Tudo pronto por aqui. Falta só o primeiro casal chegar." />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <Panel title="Para abrir as portas" aside={<span className="text-sm text-tinta-suave">{done} de {checklist.length}</span>}>
          <ul className="flex flex-col">
            {checklist.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-linha py-4 first:pt-0 last:border-b-0 last:pb-0">
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border-2", item.done ? "border-sucesso bg-sucesso text-white" : "border-linha-forte")} aria-hidden="true">
                  {item.done && <Check className="size-4" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1 basis-48">
                  <span className="block font-semibold text-tinta">{item.title}</span>
                  <span className="block text-sm text-tinta-suave">{item.detail}</span>
                </span>
                {item.done ? (
                  <StatusChip tone="sucesso" icon={CheckCircle2}>
                    Feito
                  </StatusChip>
                ) : (
                  <Link href={item.href} className={`${btn.secondary} ${btn.sm}`}>
                    {item.actionLabel}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Panel>
        <div className="flex flex-col gap-6">
          <Panel title="Receita">
            <EmptyState icon={Wallet} compact title="Ainda sem pagamentos">
              Quando chegar o primeiro pagamento, a receita do mês aparece aqui.
            </EmptyState>
          </Panel>
          <Panel title="Precisa da sua atenção">
            <EmptyState icon={CheckCircle2} compact title="Tudo em dia">
              Pedidos de domínio, Pix para conferir e fornecedores na curadoria aparecem aqui.
            </EmptyState>
          </Panel>
        </div>
      </div>
      <Panel title="Novos casais">
        <EmptyState
          icon={Heart}
          title="Nenhum casal ainda"
          action={
            <Link href="/planos" className={`${btn.secondary} ${btn.sm} gap-2`}>
              <ExternalLink className="size-4" aria-hidden="true" /> Ver a página de planos
            </Link>
          }
        >
          Quando o primeiro casal criar o casamento, você acompanha o caminho dele até o plano pago.
        </EmptyState>
      </Panel>
    </>
  );
}
