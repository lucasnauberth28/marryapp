import { Suspense } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, Bell, Check, CheckCircle2, Clock, Globe, Heart, LifeBuoy, MessageSquare, ShieldCheck, Wallet, ExternalLink } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { RegiaoPendente } from "@/components/plataforma/pending";
import { Painel } from "@/components/plataforma/panel";
import { CartaoDeIndicador, GradeDeIndicadores } from "@/components/plataforma/stat-card";
import { ListaDeAtencao, type ItemDeAtencao } from "@/components/plataforma/attention-list";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { GraficoDeReceita } from "@/components/plataforma/revenue-chart";
import { EtiquetaDePlano, EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { estiloDoBotao } from "@/components/landing/styles";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { type ParametrosDeBusca, umDosValores } from "@/lib/platform/list-params";
import { formatarDiaEMes, formatarInteiro, formatarDataPorExtenso, formatarNomeDoMes, formatarPercentual, diaRelativo, haQuantoTempo, formatarHora } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarReaisInteiros } from "@/lib/formatacao/dinheiro";
import { PERIODOS, janelasDoPeriodo, type Periodo } from "@/lib/platform/overview-period";
import { rotuloPercentual } from "@/lib/platform/revenue";
import { obterReceitaPorMes } from "@/lib/platform/queries/receita";
import { obterPlanosDeFornecedorPrestesAVencer } from "@/lib/platform/queries/fornecedores";
import { obterFunil, obterItensDeAtencao, obterErrosRecentes, obterListaDeConfiguracao, obterCasamentosProximos } from "@/lib/platform/queries/atencao";
import { saudacaoParaAHora } from "@/lib/wedding-format";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { loadOverviewNumbers } from "./_visao-geral/data";
import { PeriodSelect } from "./_visao-geral/period-select";
import { AttentionBlockSkeleton, ErrorsBlockSkeleton, ExpiringBlockSkeleton, FunnelBlockSkeleton, NumbersSkeleton, OverviewSkeleton, RevenueBlockSkeleton, UpcomingBlockSkeleton } from "./_visao-geral/skeletons";

export const metadata = { title: "Visão geral" };

const ICONS = { clock: Clock, alert: AlertTriangle, shield: ShieldCheck, globe: Globe, activity: Activity, life: LifeBuoy, wallet: Wallet, message: MessageSquare } as const;

/**
 * Visão geral. A página só espera o guard e a URL; o resto chega por streaming: o cabeçalho sai logo e cada bloco
 * (números, atenção, receita, funil, casamentos próximos, planos vencendo, erros) carrega no seu Suspense,
 * independente dos outros, com esqueleto do tamanho real.
 */
export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  const admin = await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" }).format(now)) % 24;
  const greeting = admin.firstName ? `${saudacaoParaAHora(hour)}, ${admin.firstName}` : saudacaoParaAHora(hour);
  const eyebrow = formatarDataPorExtenso(now).toLocaleUpperCase("pt-BR");
  const period = umDosValores(query, "periodo", PERIODOS) ?? "30d";

  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <Overview eyebrow={eyebrow} title={greeting} period={period} now={now} />
    </Suspense>
  );
}

async function Overview({ eyebrow, title, period, now }: { eyebrow: string; title: string; period: Periodo; now: Date }) {
  const weddingCount = await prisma.wedding.count();
  if (weddingCount === 0) return <EmptyOverview eyebrow={eyebrow} title={title} />;

  return (
    <>
      <CabecalhoDaPagina eyebrow={eyebrow} title={title} description="O que pede a sua decisão hoje e como a plataforma está indo." actions={<PeriodSelect value={period} />} />

      <Suspense fallback={<NumbersSkeleton />}>
        <NumbersBlock period={period} now={now} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Suspense fallback={<AttentionBlockSkeleton />}>
          <AttentionBlock now={now} />
        </Suspense>
        <Suspense fallback={<RevenueBlockSkeleton />}>
          <RevenueBlock now={now} />
        </Suspense>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <Suspense fallback={<FunnelBlockSkeleton />}>
          <FunnelBlock period={period} now={now} />
        </Suspense>
        <Suspense fallback={<UpcomingBlockSkeleton />}>
          <UpcomingBlock period={period} now={now} />
        </Suspense>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Suspense fallback={<ExpiringBlockSkeleton />}>
          <ExpiringBlock now={now} />
        </Suspense>
        <Suspense fallback={<ErrorsBlockSkeleton />}>
          <ErrorsBlock now={now} />
        </Suspense>
      </div>
    </>
  );
}

async function NumbersBlock({ period, now }: { period: Periodo; now: Date }) {
  const numbers = await loadOverviewNumbers(period);
  const win = janelasDoPeriodo(period, now);
  const revenueTitle = period === "mes" ? `Receita de ${formatarNomeDoMes(now)}` : `Receita, ${win.short}`;
  return (
    <RegiaoPendente>
      <GradeDeIndicadores>
        <CartaoDeIndicador
          label={revenueTitle}
          value={formatarReaisInteiros(numbers.revenue.cents)}
          trend={numbers.revenue.trend === null ? null : { value: numbers.revenue.trend, label: rotuloPercentual(numbers.revenue.trend) }}
          hint={numbers.revenue.payments === 0 ? "nenhum pagamento ainda" : `${period === "mes" ? "até hoje, " : ""}${pluralizar(numbers.revenue.payments, "pagamento", "pagamentos")}`}
          href="/admin/planos"
        />
        <CartaoDeIndicador
          label={`Novos casais, ${win.short}`}
          value={formatarInteiro(numbers.newCouples.count)}
          trend={numbers.newCouples.trend === null ? null : { value: numbers.newCouples.trend, label: rotuloPercentual(numbers.newCouples.trend) }}
          hint={numbers.newCouples.previous > 0 ? `contra ${formatarInteiro(numbers.newCouples.previous)} antes` : "sem período anterior para comparar"}
          href="/admin/casais"
        />
        <CartaoDeIndicador
          label="Casamentos em 30 dias"
          value={formatarInteiro(numbers.next30.count)}
          hint={numbers.next30.count === 0 ? "nenhum nos próximos 30 dias" : numbers.next30.needAttention > 0 ? `${numbers.next30.needAttention} ${numbers.next30.needAttention === 1 ? "pede" : "pedem"} atenção` : "nenhum pede atenção"}
          href="/admin/casais?aba=30dias"
        />
        <CartaoDeIndicador
          label="Esperando curadoria"
          value={formatarInteiro(numbers.curation.count)}
          hint={numbers.curation.oldestAt ? `o mais antigo, ${haQuantoTempo(numbers.curation.oldestAt, now)}` : "ninguém na fila"}
          highlight={numbers.curation.count > 0}
          href="/admin/fornecedores/curadoria"
        />
      </GradeDeIndicadores>
    </RegiaoPendente>
  );
}

async function AttentionBlock({ now }: { now: Date }) {
  const attention = await obterItensDeAtencao(now);
  const attentionItems: ItemDeAtencao[] = attention.map((a) => ({ id: a.id, title: a.title, detail: a.detail, tone: a.tone, icon: ICONS[a.icon], actionLabel: a.actionLabel, href: a.href }));
  return (
    <Painel
      title="Precisa da sua atenção"
      aside={
        attentionItems.length > 0 ? (
          <EtiquetaDeSituacao tone="aviso" icon={Bell}>
            {pluralizar(attentionItems.length, "item", "itens")}
          </EtiquetaDeSituacao>
        ) : undefined
      }
    >
      {attentionItems.length > 0 ? (
        <ListaDeAtencao items={attentionItems} />
      ) : (
        <EstadoVazio icon={CheckCircle2} compact title="Tudo em dia">
          Pedidos de domínio, Pix para conferir, reembolsos e fornecedores na curadoria aparecem aqui.
        </EstadoVazio>
      )}
    </Painel>
  );
}

async function RevenueBlock({ now }: { now: Date }) {
  const months = await obterReceitaPorMes(now, 7);
  const hasRevenue = months.some((m) => m.total > 0);
  const current = months[months.length - 1];
  return (
    <Painel title="Receita por mês">
      {hasRevenue ? (
        <>
          <GraficoDeReceita months={months} />
          <p className="mt-4 text-sm leading-6 text-tinta-suave">
            Em {formatarNomeDoMes(now)}, até hoje: casais {formatarReaisInteiros(current.couple)} e fornecedores {formatarReaisInteiros(current.vendor)}.
          </p>
        </>
      ) : (
        <EstadoVazio icon={Wallet} compact title="Ainda sem pagamentos" action={<Link href="/planos" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>Ver a página de planos</Link>}>
          Quando chegar o primeiro pagamento, a receita de cada mês aparece aqui.
        </EstadoVazio>
      )}
    </Painel>
  );
}

async function FunnelBlock({ period, now }: { period: Periodo; now: Date }) {
  const win = janelasDoPeriodo(period, now);
  const funnel = await obterFunil(win);
  const funnelMax = Math.max(1, funnel[0]?.count ?? 0);
  return (
    <RegiaoPendente>
      <Painel title="De cadastro a casal pagante" aside={<span className="text-sm text-tinta-suave">{win.label}</span>}>
        <p className="mb-5 text-tinta">
          <strong>{formatarInteiro(funnel[0].count)}</strong> {funnel[0].count === 1 ? "casal criou" : "casais criaram"} o casamento {win.period === "mes" ? "neste mês" : `nos últimos ${win.short}`}.
        </p>
        {funnel[0].count === 0 ? (
          <p className="text-tinta-suave">Nenhum casamento novo neste período.</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {funnel.map((step, i) => {
              const pct = i === 0 ? null : formatarPercentual(step.count, funnel[i - 1].count);
              return (
                <li key={step.key} className="grid grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-[180px_1fr_130px]">
                  <span className="text-tinta">{step.label}</span>
                  <span className="h-3 overflow-hidden rounded-full bg-areia" aria-hidden="true">
                    <span className="block h-full rounded-full bg-ameixa" style={{ width: `${(step.count / funnelMax) * 100}%` }} />
                  </span>
                  <span className="leading-5">
                    <span className="font-semibold tabular-nums text-tinta">{formatarInteiro(step.count)}</span>
                    {pct && <span className="block text-sm text-tinta-suave">{pct} do passo anterior</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </Painel>
    </RegiaoPendente>
  );
}

async function UpcomingBlock({ period, now }: { period: Periodo; now: Date }) {
  const [numbers, upcoming] = await Promise.all([loadOverviewNumbers(period), obterCasamentosProximos(now, 5)]);
  return (
    <Painel title="Casamentos nos próximos 30 dias" action={numbers.next30.count > 0 ? { label: `Ver os ${numbers.next30.count}`, href: "/admin/casais?aba=30dias" } : undefined}>
      {upcoming.length === 0 ? (
        <EstadoVazio icon={Heart} compact title="Nenhum casamento nos próximos 30 dias">
          Quando houver datas chegando, os casais aparecem aqui com a situação de cada um.
        </EstadoVazio>
      ) : (
        <ul className="flex flex-col">
          {upcoming.map((w) => (
            <li key={w.id} className="relative flex items-center gap-4 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
              <span className="w-12 shrink-0 text-center leading-tight" aria-label={diaRelativo(w.weddingDate, now)}>
                <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">{formatarDiaEMes(w.weddingDate).split(" ")[1]}</span>
                <span className="block font-num text-2xl text-tinta">{formatarDiaEMes(w.weddingDate).split(" ")[0]}</span>
              </span>
              <span className="min-w-0 flex-1">
                <Link href={`/admin/casais/${w.id}`} className="font-semibold text-tinta after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa">
                  {w.coupleNames}
                </Link>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-tinta-suave">
                  {w.city && <span>{w.city}</span>}
                  <EtiquetaDePlano plan={w.planId} className="min-h-6 px-2 text-xs" />
                </span>
              </span>
              <EtiquetaDeSituacao tone={w.status.tone} className="hidden sm:inline-flex">
                {w.status.label}
              </EtiquetaDeSituacao>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}

async function ExpiringBlock({ now }: { now: Date }) {
  const expiring = await obterPlanosDeFornecedorPrestesAVencer(now, 7, 5);
  return (
    <Painel title="Planos de fornecedores vencendo" action={{ label: "Ver todos", href: "/admin/fornecedores?aba=vencendo" }}>
      {expiring.length === 0 ? (
        <p className="text-tinta-suave">Nenhum plano pago vence nos próximos 7 dias.</p>
      ) : (
        <ul className="flex flex-col">
          {expiring.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
              <span>
                <span className="block font-semibold text-tinta">{v.companyName}</span>
                <span className="block text-sm text-tinta-suave">
                  {diaRelativo(v.planExpiresAt, now)}, {formatarDiaEMes(v.planExpiresAt)}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <EtiquetaDePlano plan={v.planTier} />
                {v.reminderSent ? (
                  <EtiquetaDeSituacao tone="neutro" icon={Check}>
                    Aviso enviado
                  </EtiquetaDeSituacao>
                ) : (
                  <EtiquetaDeSituacao tone="aviso" icon={Clock}>
                    Aviso pendente
                  </EtiquetaDeSituacao>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}

async function ErrorsBlock({ now }: { now: Date }) {
  const errors = await obterErrosRecentes(now);
  return (
    <Painel title="Erros e falhas nas últimas 24 horas" action={{ label: "Saúde do sistema", href: "/admin/saude" }}>
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
                  {s.total === 0 ? "Sem registros nas últimas 24 horas" : s.failures === 0 ? `Nenhuma falha em ${pluralizar(s.total, "registro", "registros")}` : `${pluralizar(s.failures, "falha", "falhas")}${s.lastFailureAt ? `, a última às ${formatarHora(s.lastFailureAt)}` : ""}`}
                </span>
              </span>
              {s.total > 0 &&
                (s.failures > 0 ? (
                  <EtiquetaDeSituacao tone="aviso" icon={AlertTriangle}>
                    Atenção
                  </EtiquetaDeSituacao>
                ) : (
                  <EtiquetaDeSituacao tone="sucesso" icon={CheckCircle2}>
                    Sem falhas
                  </EtiquetaDeSituacao>
                ))}
            </li>
          ))}
          {errors.failedCrons.map((c) => (
            <li key={c.job} className="flex flex-wrap items-center justify-between gap-2 border-b border-linha py-3 last:border-b-0">
              <span>
                <span className="block font-semibold text-tinta">Rotina diária ({c.job})</span>
                <span className="block text-sm text-tinta-suave">Falhou {haQuantoTempo(c.at, now)}</span>
              </span>
              <EtiquetaDeSituacao tone="perigo" icon={AlertTriangle}>
                Falhou
              </EtiquetaDeSituacao>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}

/** Versão "Vazia" do desenho: ainda não há nenhum casamento. */
async function EmptyOverview({ eyebrow, title }: { eyebrow: string; title: string }) {
  const checklist = await obterListaDeConfiguracao();
  const done = checklist.filter((i) => i.done).length;
  return (
    <>
      <CabecalhoDaPagina eyebrow={eyebrow} title={title} description="Tudo pronto por aqui. Falta só o primeiro casal chegar." />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <Painel title="Para abrir as portas" aside={<span className="text-sm text-tinta-suave">{done} de {checklist.length}</span>}>
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
                  <EtiquetaDeSituacao tone="sucesso" icon={CheckCircle2}>
                    Feito
                  </EtiquetaDeSituacao>
                ) : (
                  <Link href={item.href} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
                    {item.actionLabel}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Painel>
        <div className="flex flex-col gap-6">
          <Painel title="Receita">
            <EstadoVazio icon={Wallet} compact title="Ainda sem pagamentos">
              Quando chegar o primeiro pagamento, a receita do mês aparece aqui.
            </EstadoVazio>
          </Painel>
          <Painel title="Precisa da sua atenção">
            <EstadoVazio icon={CheckCircle2} compact title="Tudo em dia">
              Pedidos de domínio, Pix para conferir e fornecedores na curadoria aparecem aqui.
            </EstadoVazio>
          </Painel>
        </div>
      </div>
      <Painel title="Novos casais">
        <EstadoVazio
          icon={Heart}
          title="Nenhum casal ainda"
          action={
            <Link href="/planos" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm} gap-2`}>
              <ExternalLink className="size-4" aria-hidden="true" /> Ver a página de planos
            </Link>
          }
        >
          Quando o primeiro casal criar o casamento, você acompanha o caminho dele até o plano pago.
        </EstadoVazio>
      </Painel>
    </>
  );
}
