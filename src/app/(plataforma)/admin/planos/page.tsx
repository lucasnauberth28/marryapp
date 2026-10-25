import { Suspense } from "react";
import Link from "next/link";
import { Clock, Download, Pencil, ReceiptText, RotateCcw, TicketPercent, TrendingUp } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { ListaDeAtencao, type ItemDeAtencao } from "@/components/plataforma/attention-list";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDePlano, EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { TabelaResponsiva } from "@/components/plataforma/responsive-table";
import { GraficoDeReceita } from "@/components/plataforma/revenue-chart";
import { CartaoDeIndicador, GradeDeIndicadores } from "@/components/plataforma/stat-card";
import { obterCatalogo } from "@/lib/catalog-server";
import { formatarData, formatarInteiro, formatarNomeDoMes, diaRelativo, haQuantoTempo } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarReais, formatarReaisInteiros } from "@/lib/formatacao/dinheiro";
import { umDosValores, type ParametrosDeBusca } from "@/lib/platform/list-params";
import { mesDoContador } from "@/lib/platform/payments";
import { rotuloPercentual } from "@/lib/platform/revenue";
import { obterPlanosDeFornecedorPrestesAVencer } from "@/lib/platform/queries/fornecedores";
import {
  contarNotasPendentes,
  obterCasaisQuePagaramNesteMes,
  obterReceitaDoMes,
  obterNaoRenovacoes,
  obterReembolsosPendentes,
  obterPixParaConferir,
  obterReceitaRecorrente,
  obterReceitaPorMes,
  listarCuponsEmUso,
  listarNotasPendentes,
  listarPagamentosReembolsaveis,
  listarReembolsos,
} from "@/lib/platform/queries/receita";
import { obterConfiguracaoDaPlataforma } from "@/lib/platform/settings";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { SecaoDoContador } from "./_components/contador-section";
import { RegiaoPendente } from "@/components/plataforma/pending";
import { AbasDePlanos } from "./_components/planos-tabs";
import { EsqueletoDoContador, EsqueletoDosReembolsos, EsqueletoDoResumo } from "./_components/skeletons";
import { SecaoDeReembolsos } from "./_components/refunds-section";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planos e receita" };

const ABAS_DA_PAGINA = ["resumo", "reembolsos", "contador"] as const;

export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const aba = umDosValores(query, "aba", ABAS_DA_PAGINA) ?? "resumo";
  const now = new Date();

  return (
    <>
      <CabecalhoDaPagina
        eyebrow="Dinheiro"
        title="Planos e receita"
        description="Casais pagam uma vez. Fornecedores pagam por mês."
        actions={
          <>
            <Link href="/admin/planos/catalogo" className={estiloDoBotao.secondary}>
              <Pencil className="size-4" aria-hidden="true" /> Catálogo e preços
            </Link>
            <Link href="/admin/planos?aba=contador" className={estiloDoBotao.secondary}>
              <Download className="size-4" aria-hidden="true" /> Exportar para o contador
            </Link>
          </>
        }
      />
      <AbasDePlanos active={aba} />
      {/* Cada aba busca os próprios dados: abas e cabeçalho ficam, só o corpo mostra o esqueleto (key = aba) */}
      <RegiaoPendente className="flex flex-col gap-6">
        <Suspense key={aba} fallback={aba === "resumo" ? <EsqueletoDoResumo /> : aba === "reembolsos" ? <EsqueletoDosReembolsos /> : <EsqueletoDoContador />}>
          {aba === "resumo" ? <ResumoDosPlanos now={now} /> : aba === "reembolsos" ? <ReembolsosDosPlanos now={now} /> : <ContadorDosPlanos now={now} month={mesDoContador(typeof query.mes === "string" ? query.mes : undefined, now)} />}
        </Suspense>
      </RegiaoPendente>
    </>
  );
}

async function ResumoDosPlanos({ now }: { now: Date }) {
  const [month, couples, recurring, nonRenewals, months, pix, refunds, invoiceCount, expiring, coupons, refundRows, catalog] = await Promise.all([
    obterReceitaDoMes(now),
    obterCasaisQuePagaramNesteMes(now),
    obterReceitaRecorrente(now),
    obterNaoRenovacoes(now),
    obterReceitaPorMes(now, 7),
    obterPixParaConferir(now),
    obterReembolsosPendentes(),
    contarNotasPendentes(),
    obterPlanosDeFornecedorPrestesAVencer(now, 7, 8),
    listarCuponsEmUso(now, 5),
    listarReembolsos(5),
    obterCatalogo(),
  ]);
  const monthName = formatarNomeDoMes(now);
  const hasRevenue = months.some((m) => m.total > 0);

  const attention: ItemDeAtencao[] = [];
  if (pix.count > 0)
    attention.push({
      id: "pix",
      icon: Clock,
      tone: "aviso",
      title: `${pluralizar(pix.count, "Pix para conferir", "Pix para conferir")}`,
      detail: `${formatarReais(pix.totalCents)} no total.${pix.oldestAt ? ` O mais antigo é ${haQuantoTempo(pix.oldestAt, now)}.` : ""}`,
      actionLabel: "Conferir",
      href: "/admin/planos/assinaturas?status=a-conferir",
    });
  if (refunds.count > 0)
    attention.push({
      id: "reembolso",
      icon: RotateCcw,
      tone: "aviso",
      title: pluralizar(refunds.count, "reembolso para decidir", "reembolsos para decidir"),
      detail: `${formatarReais(refunds.totalCents)} no total.${refunds.nextDueAt ? ` Responder até ${formatarData(refunds.nextDueAt)}.` : ""}`,
      actionLabel: "Analisar",
      href: "/admin/planos?aba=reembolsos",
    });
  if (invoiceCount > 0)
    attention.push({
      id: "notas",
      icon: ReceiptText,
      tone: "aviso",
      title: pluralizar(invoiceCount, "nota fiscal pendente", "notas fiscais pendentes"),
      detail: "Pagamentos aprovados sem nota emitida.",
      actionLabel: "Ver notas",
      href: "/admin/planos?aba=contador",
    });

  return (
    <>
      <GradeDeIndicadores>
        <CartaoDeIndicador
          label={`Receita de ${monthName}`}
          value={formatarReaisInteiros(month.cents)}
          trend={month.change === null ? null : { value: month.change, label: rotuloPercentual(month.change) }}
          hint={month.payments === 0 ? "nenhum pagamento até agora" : `até hoje, ${pluralizar(month.payments, "pagamento", "pagamentos")}`}
        />
        <CartaoDeIndicador label="Mensalidades" value={formatarReaisInteiros(recurring.cents)} hint={`${recurring.pro} Pro e ${recurring.master} Master em vigor`} />
        <CartaoDeIndicador
          label={`Não renovaram em ${monthName}`}
          value={nonRenewals.of === 0 ? "0" : `${nonRenewals.count} de ${nonRenewals.of}`}
          hint={nonRenewals.of === 0 ? "nenhum plano de fornecedor venceu no mês" : "planos de fornecedor que venceram sem pagar de novo"}
        />
        <CartaoDeIndicador
          label="Valor médio por casal"
          value={couples.averageCents === null ? "Sem dados" : formatarReaisInteiros(couples.averageCents)}
          hint={couples.payments === 0 ? `nenhum casal pagou em ${monthName}` : `${pluralizar(couples.payments, "casal pagou", "casais pagaram")} em ${monthName}`}
        />
      </GradeDeIndicadores>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Painel title="Receita por mês">
          {hasRevenue ? (
            <GraficoDeReceita months={months} />
          ) : (
            <EstadoVazio icon={TrendingUp} title="Ainda sem pagamentos" compact>
              Quando o primeiro casal ou fornecedor pagar um plano, a receita de cada mês aparece aqui.
            </EstadoVazio>
          )}
        </Painel>
        <Painel title="Para resolver">
          {attention.length > 0 ? <ListaDeAtencao items={attention} /> : <EstadoVazio title="Tudo em dia" compact>Nenhum Pix para conferir, reembolso para decidir nem nota pendente.</EstadoVazio>}
        </Painel>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Painel title="Vencimentos da semana" action={{ label: "Ver fornecedores", href: "/admin/fornecedores?aba=vencendo" }} padded={false}>
          <div className="px-3 pb-3 md:px-4 md:pb-4">
            <TabelaResponsiva
              caption="Planos de fornecedor que vencem nos próximos 7 dias"
              rows={expiring}
              rowKey={(v) => v.id}
              empty={<EstadoVazio icon={Clock} title="Nenhum plano vence esta semana" compact />}
              columns={[
                { key: "nome", header: "Fornecedor", primary: true, cell: (v) => v.companyName },
                { key: "plano", header: "Plano", cell: (v) => <EtiquetaDePlano plan={v.planTier} /> },
                { key: "vence", header: "Vence", cell: (v) => `${formatarData(v.planExpiresAt)} (${diaRelativo(v.planExpiresAt, now)})` },
                { key: "valor", header: "Valor", align: "right", cell: (v) => formatarReais(catalog.plans[v.planTier === "PRO" ? "pro" : "master"].price) },
                {
                  key: "aviso",
                  header: "Aviso",
                  cell: (v) => (v.reminderSent ? <EtiquetaDeSituacao tone="sucesso">Enviado</EtiquetaDeSituacao> : <EtiquetaDeSituacao tone="neutro" icon={Clock}>Pendente</EtiquetaDeSituacao>),
                },
              ]}
            />
          </div>
        </Painel>
        <Painel title="Cupons em uso" action={{ label: "Gerenciar cupons", href: "/admin/planos/cupons" }} padded={false}>
          <div className="px-3 pb-3 md:px-4 md:pb-4">
            <TabelaResponsiva
              caption="Cupons valendo agora"
              rows={coupons}
              rowKey={(c) => c.id}
              empty={<EstadoVazio icon={TicketPercent} title="Nenhum cupom valendo" compact>Crie um cupom em Gerenciar cupons.</EstadoVazio>}
              columns={[
                { key: "codigo", header: "Código", primary: true, cell: (c) => <span className="font-mono">{c.code}</span> },
                { key: "desconto", header: "Desconto", cell: (c) => (c.percentOff ? `${c.percentOff}%` : c.amountOff ? formatarReais(c.amountOff) : "Sem desconto") },
                { key: "usos", header: "Usos", align: "right", cell: (c) => (c.maxRedemptions ? `${formatarInteiro(c.redemptions)} de ${formatarInteiro(c.maxRedemptions)}` : formatarInteiro(c.redemptions)) },
                { key: "ate", header: "Vale até", cell: (c) => (c.expiresAt ? formatarData(c.expiresAt) : "Sem prazo") },
              ]}
            />
          </div>
        </Painel>
      </div>

      <SecaoDeReembolsos refunds={refundRows} now={now} preview />
    </>
  );
}

async function ReembolsosDosPlanos({ now }: { now: Date }) {
  const [refunds, payments, policy] = await Promise.all([listarReembolsos(50), listarPagamentosReembolsaveis(), obterConfiguracaoDaPlataforma("refundPolicy")]);
  return <SecaoDeReembolsos refunds={refunds} payments={payments} now={now} policyText={policy.text} />;
}

async function ContadorDosPlanos({ now, month }: { now: Date; month: string }) {
  const [invoices, count] = await Promise.all([listarNotasPendentes(20), contarNotasPendentes()]);
  return <SecaoDoContador month={month} now={now} invoices={invoices} pendingCount={count} />;
}
