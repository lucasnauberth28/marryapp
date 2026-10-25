import Link from "next/link";
import { Download, Heart, Search } from "lucide-react";
import { PageHeader } from "@/components/plataforma/page-header";
import { TabsNav } from "@/components/plataforma/tabs-nav";
import { FilterBar } from "@/components/plataforma/filter-bar";
import { ExportButton } from "@/components/plataforma/export-button";
import { PendingRegion } from "@/components/plataforma/pending";
import { Pagination } from "@/components/plataforma/pagination";
import { EmptyState } from "@/components/plataforma/empty-state";
import { btn } from "@/components/landing/styles";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { type ParametrosDeBusca, montarLink, umDosValores, parametroDaBusca, interpretarPagina, TAMANHO_PADRAO_DA_PAGINA } from "@/lib/platform/list-params";
import { formatarInteiro } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import {
  FILTROS_DE_ATIVIDADE,
  ABAS_DE_CASAIS,
  FILTROS_DE_DATA,
  FILTROS_DE_DOMINIO,
  FILTROS_DE_INICIO,
  FILTROS_DE_PLANO,
  type FiltrosDeCasais,
} from "@/lib/platform/casais-filters";
import { ORDENACOES_DE_CASAIS, obterContagensDeCasais, listarCasais, idsDeCasamentoDoPlano } from "@/lib/platform/queries/casais";
import { CasaisList, type CasalListRow } from "./_components/casais-list";

export const metadata = { title: "Casais" };

const ACOMPANHAR = ["marcados"] as const;

export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;

  const tab = umDosValores(query, "aba", ABAS_DE_CASAIS) ?? "todos";
  const q = parametroDaBusca(query, "q");
  const plano = umDosValores(query, "plano", FILTROS_DE_PLANO);
  const data = umDosValores(query, "data", FILTROS_DE_DATA);
  const onboarding = umDosValores(query, "onboarding", FILTROS_DE_INICIO);
  const atividade = umDosValores(query, "atividade", FILTROS_DE_ATIVIDADE);
  const dominio = umDosValores(query, "dominio", FILTROS_DE_DOMINIO);
  const acompanhar = umDosValores(query, "acompanhar", ACOMPANHAR);
  const ordem = umDosValores(query, "ordem", ORDENACOES_DE_CASAIS) ?? "recentes";
  const now = new Date();

  const filters: FiltrosDeCasais = {
    tab,
    q,
    data,
    onboarding,
    atividade,
    dominio,
    acompanhar: Boolean(acompanhar),
    planIds: plano ? await idsDeCasamentoDoPlano(plano) : undefined,
  };

  const [counts, result] = await Promise.all([
    obterContagensDeCasais(now),
    listarCasais({ filters, order: ordem, page: interpretarPagina(query), pageSize: TAMANHO_PADRAO_DA_PAGINA, now }),
  ]);

  const active = { q, plano, data, onboarding, atividade, dominio, acompanhar, ordem: ordem === "recentes" ? undefined : ordem };
  const exportHref = montarLink("/api/admin/casais.csv", { aba: tab === "todos" ? undefined : tab, ...active });
  const rows: CasalListRow[] = result.rows.map((r) => ({
    id: r.id,
    coupleNames: r.coupleNames,
    ownerEmail: r.ownerEmail,
    weddingDate: r.weddingDate?.toISOString() ?? null,
    city: r.city,
    planId: r.planId,
    guests: r.guests,
    confirmed: r.confirmed,
    giftsCents: r.giftsCents,
    lastActiveAt: r.lastActiveAt?.toISOString() ?? null,
    flagged: r.flagged,
    situation: r.situation,
  }));

  const hasAnyWedding = counts.total > 0;
  const subtitle = hasAnyWedding ? `${pluralizar(counts.total, "casamento", "casamentos")}, ${formatarInteiro(counts.paid)} com plano pago.` : "Todos os casamentos do Aceito, com plano, convidados e última atividade.";

  const exportButton = hasAnyWedding && result.total > 0 ? (
    <ExportButton href={exportHref} fallbackName="casais.csv" className="gap-2">
      <Download className="size-4" aria-hidden="true" /> Exportar CSV
    </ExportButton>
  ) : (
    <span aria-disabled="true" className={`${btn.secondary} gap-2 opacity-50`}>
      <Download className="size-4" aria-hidden="true" /> Exportar CSV
    </span>
  );

  return (
    <>
      <PageHeader eyebrow="Casais e fornecedores" title="Casais" description={subtitle} actions={exportButton} />

      {!hasAnyWedding ? (
        <div className="rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]">
          <EmptyState
            icon={Heart}
            title="Ainda não tem ninguém aqui"
            action={
              <Link href="/cadastro" className={`${btn.secondary} ${btn.sm}`}>
                Ver a página de cadastro
              </Link>
            }
          >
            Quando um casal criar o casamento, ele aparece nesta lista com plano, convidados e última atividade.
          </EmptyState>
        </div>
      ) : (
        <>
          <TabsNav
            label="Grupos de casais"
            basePath="/admin/casais"
            params={active}
            active={tab}
            tabs={[
              { value: "todos", label: "Todos", count: counts.total },
              { value: "problema", label: "Com problema", count: counts.problema },
              { value: "30dias", label: "Casamento em 30 dias", count: counts.proximos30 },
              { value: "inativos", label: "Sem atividade", count: counts.inativos },
              { value: "onboarding", label: "Onboarding incompleto", count: counts.onboarding },
            ]}
          />
          <FilterBar
            searchPlaceholder="Buscar por nome, e-mail ou endereço do site"
            filters={[
              { key: "plano", label: "Plano", allLabel: "Todos", options: [{ value: "basic", label: "Básico" }, { value: "classic", label: "Classic" }, { value: "vip", label: "VIP" }, { value: "custom", label: "Adaptado" }] },
              { key: "data", label: "Data do casamento", allLabel: "Qualquer data", options: [{ value: "prox30", label: "Próximos 30 dias" }, { value: "prox90", label: "Próximos 90 dias" }, { value: "passados", label: "Já aconteceram" }, { value: "semdata", label: "Sem data" }] },
              { key: "onboarding", label: "Etapa do onboarding", allLabel: "Todas", options: [{ value: "concluido", label: "Concluído" }, { value: "pendente", label: "Pendente" }] },
              { key: "atividade", label: "Atividade recente", allLabel: "Qualquer", options: [{ value: "hoje", label: "Hoje" }, { value: "7d", label: "Últimos 7 dias" }, { value: "30d", label: "Últimos 30 dias" }, { value: "sem", label: "Sem atividade" }] },
              { key: "dominio", label: "Domínio próprio", allLabel: "Tanto faz", options: [{ value: "proprio", label: "No ar" }, { value: "pedido", label: "Pedido em andamento" }, { value: "nenhum", label: "Nenhum" }] },
              { key: "acompanhar", label: "Acompanhamento", allLabel: "Todos", options: [{ value: "marcados", label: "Marcados para acompanhar" }] },
              { key: "ordem", label: "Ordenar por", allLabel: "Mais recentes", options: [{ value: "data", label: "Data do casamento" }, { value: "atividade", label: "Atividade recente" }, { value: "nome", label: "Nome" }] },
            ]}
          />

          <PendingRegion className="flex flex-col gap-6">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]">
              <EmptyState
                icon={Search}
                title="Nenhum casal com esses filtros"
                action={
                  <Link href={montarLink("/admin/casais", { aba: tab === "todos" ? undefined : tab })} className={`${btn.secondary} ${btn.sm}`}>
                    Limpar filtros
                  </Link>
                }
              >
                Tente tirar um filtro ou buscar por outro nome, e-mail ou endereço do site.
              </EmptyState>
            </div>
          ) : (
            <CasaisList rows={rows} />
          )}

          <Pagination page={result.page} pageSize={TAMANHO_PADRAO_DA_PAGINA} total={result.total} basePath="/admin/casais" params={{ aba: tab === "todos" ? undefined : tab, ...active }} noun={["casal", "casais"]} />
          </PendingRegion>
        </>
      )}
    </>
  );
}
