import Link from "next/link";
import { Check, Clock, Download, Flag, Pencil, ShieldCheck, Star, Store, Ban } from "lucide-react";
import { btn } from "@/components/landing/styles";
import { EmptyState } from "@/components/plataforma/empty-state";
import { ExportButton } from "@/components/plataforma/export-button";
import { FilterBar } from "@/components/plataforma/filter-bar";
import { PageHeader } from "@/components/plataforma/page-header";
import { Pagination } from "@/components/plataforma/pagination";
import { Panel } from "@/components/plataforma/panel";
import { ResponsiveTable } from "@/components/plataforma/responsive-table";
import { PlanChip, StatusChip, type StatusTone } from "@/components/plataforma/status-chip";
import { TabsNav } from "@/components/plataforma/tabs-nav";
import { formatDate, formatInt, plural, relativeDay, timeAgo } from "@/lib/platform/format";
import { buildHref, oneOf, param, parsePage, type SearchParams } from "@/lib/platform/list-params";
import {
  CURATION_FILTERS,
  PLAN_FILTERS,
  VENDOR_PAGE_SIZE,
  getAdminVendorDetail,
  getReviewsToModerate,
  getVendorFilterOptions,
  getVendorTabCounts,
  listAdminVendors,
  type AdminVendorRow,
} from "@/lib/platform/queries/fornecedores";
import { activePaidVendorWhere } from "@/lib/platform/queries/receita";
import { CURATION_LABEL, VENDOR_SORTS, VENDOR_TABS, curationView, galleryPhotos, planExpiryTone, type CurationView } from "@/lib/platform/vendor-admin";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { VendorActionsPanel } from "./vendor-actions-panel";
import { ReviewModeration } from "./review-moderation";

const VIEW_CHIP: Record<CurationView, { tone: StatusTone; icon: typeof Check }> = {
  approved: { tone: "sucesso", icon: Check },
  pending: { tone: "aviso", icon: Clock },
  adjust: { tone: "neutro", icon: Pencil },
  suspended: { tone: "perigo", icon: Ban },
};

const TAB_LABEL: Record<(typeof VENDOR_TABS)[number], string> = {
  todos: "Todos",
  curadoria: "Aguardando curadoria",
  "pro-master": "Pro e Master",
  vencendo: "Vencendo",
  denuncias: "Denúncias",
};

/**
 * Tela de fornecedores da administração. `mode="curadoria"` é a mesma tela com a fila de cadastros esperando
 * análise (rota /admin/fornecedores/curadoria): sem abas, o primeiro da fila já abre no painel.
 */
export async function VendorsScreen({ searchParams, mode }: { searchParams: SearchParams; mode: "lista" | "curadoria" }) {
  const now = new Date();
  const basePath = mode === "curadoria" ? "/admin/fornecedores/curadoria" : "/admin/fornecedores";
  const tab = mode === "curadoria" ? "curadoria" : (oneOf(searchParams, "aba", VENDOR_TABS) ?? "todos");
  const q = param(searchParams, "q");
  const categoria = param(searchParams, "categoria", 60);
  const regiao = param(searchParams, "regiao", 60);
  const plano = oneOf(searchParams, "plano", PLAN_FILTERS);
  const curadoria = oneOf(searchParams, "curadoria", CURATION_FILTERS);
  const ordem = oneOf(searchParams, "ordem", VENDOR_SORTS) ?? "espera";
  const selectedId = param(searchParams, "id", 40);

  const [counts, paidGroups, options, list, moderation] = await Promise.all([
    getVendorTabCounts(now),
    prisma.partnerVendor.groupBy({ by: ["planTier"], where: activePaidVendorWhere(now), _count: { _all: true } }),
    getVendorFilterOptions(),
    listAdminVendors({ tab, q, categoria, plano, curadoria, regiao, ordem, page: parsePage(searchParams) }, now),
    mode === "lista" ? getReviewsToModerate() : Promise.resolve(null),
  ]);

  const pro = paidGroups.find((g) => g.planTier === "PRO")?._count._all ?? 0;
  const master = paidGroups.find((g) => g.planTier === "MASTER")?._count._all ?? 0;
  const detailId = selectedId ?? (mode === "curadoria" ? list.rows[0]?.id : undefined);
  const detail = detailId ? await getAdminVendorDetail(detailId) : null;

  const filterParams = { q, categoria, regiao, plano, curadoria, ordem: ordem === "espera" ? undefined : ordem, aba: mode === "lista" && tab !== "todos" ? tab : undefined };
  const rowHref = (row: AdminVendorRow) => `${buildHref(basePath, { ...filterParams, pagina: list.page > 1 ? list.page : undefined, id: row.id })}#painel`;

  const oldest = counts.curadoria > 0 ? await prisma.partnerVendor.findFirst({ where: { curationStatus: "PENDING_APPROVAL" }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }) : null;

  const description =
    mode === "curadoria"
      ? counts.curadoria === 0
        ? "Nenhum cadastro esperando análise."
        : `${plural(counts.curadoria, "cadastro esperando", "cadastros esperando")} análise${oldest ? `, o mais antigo ${timeAgo(oldest.createdAt, now)}` : ""}.`
      : `${plural(counts.todos, "fornecedor", "fornecedores")}, ${formatInt(pro + master)} com plano pago (${formatInt(pro)} Pro e ${formatInt(master)} Master).`;

  const filters = [
    { key: "categoria", label: "Categoria", allLabel: "Todas", options: options.categories.map((c) => ({ value: c, label: c })) },
    { key: "plano", label: "Plano", allLabel: "Todos", options: [{ value: "FREE", label: "Start" }, { value: "PRO", label: "Pro" }, { value: "MASTER", label: "Master" }] },
    {
      key: "curadoria",
      label: "Curadoria",
      allLabel: "Todas",
      options: [
        { value: "aprovado", label: "Aprovado" },
        { value: "analise", label: "Em análise" },
        { value: "ajustes", label: "Ajustes" },
        { value: "suspenso", label: "Suspenso" },
      ],
    },
    { key: "regiao", label: "Região", allLabel: "Todas", options: options.regions.map((r) => ({ value: r, label: r })) },
    { key: "ordem", label: "Ordenar por", allLabel: "Esperando há mais tempo", options: [{ value: "nota", label: "Melhor nota" }, { value: "recentes", label: "Mais recentes" }] },
  ];

  const hasFilters = Boolean(q || categoria || regiao || plano || curadoria);

  return (
    <>
      <PageHeader
        breadcrumb={mode === "curadoria" ? [{ label: "Fornecedores", href: "/admin/fornecedores" }, { label: "Curadoria" }] : undefined}
        eyebrow="Casais e fornecedores"
        title={mode === "curadoria" ? "Curadoria" : "Fornecedores"}
        description={description}
        actions={
          mode === "lista" ? (
            <>
              <Link href="/admin/fornecedores/curadoria" className={btn.secondary}>
                <ShieldCheck className="size-4" aria-hidden="true" /> Curadoria
              </Link>
              <ExportButton href={buildHref("/api/admin/fornecedores.csv", filterParams)} fallbackName="fornecedores.csv">
                <Download className="size-4" aria-hidden="true" /> Exportar CSV
              </ExportButton>
            </>
          ) : (
            <Link href="/admin/fornecedores" className={btn.secondary}>
              <Store className="size-4" aria-hidden="true" /> Todos os fornecedores
            </Link>
          )
        }
      />

      {mode === "lista" ? (
        <TabsNav
          label="Fornecedores"
          basePath={basePath}
          active={tab}
          params={{ q, categoria, regiao, plano, curadoria, ordem: ordem === "espera" ? undefined : ordem }}
          tabs={VENDOR_TABS.map((value) => ({ value, label: TAB_LABEL[value], count: counts[value] }))}
        />
      ) : null}

      <FilterBar searchPlaceholder="Buscar por nome, categoria ou cidade" filters={mode === "curadoria" ? filters.filter((f) => f.key === "categoria" || f.key === "ordem") : filters} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <ResponsiveTable
            caption="Fornecedores"
            rows={list.rows}
            rowKey={(r) => r.id}
            rowHref={rowHref}
            selectedKey={detail?.id}
            empty={
              <EmptyState icon={Store} title={hasFilters || tab !== "todos" ? "Nenhum fornecedor com esses filtros" : "Ainda não tem fornecedor aqui"} compact>
                {hasFilters || tab !== "todos"
                  ? "Tente limpar os filtros ou escolher outra aba."
                  : "Quando um fornecedor se cadastrar, ele aparece nesta lista para a curadoria."}
              </EmptyState>
            }
            columns={[
              {
                key: "nome",
                header: "Fornecedor",
                primary: true,
                cell: (v) => (
                  <>
                    <span className="block">{v.companyName}</span>
                    <span className="block text-sm font-normal text-tinta-suave">
                      {v.category}
                      {v.city ? ` · ${v.city}` : ""}
                    </span>
                  </>
                ),
              },
              { key: "plano", header: "Plano", cell: (v) => <PlanChip plan={v.planTier} /> },
              {
                key: "curadoria",
                header: "Curadoria",
                cell: (v) => {
                  const view = curationView(v);
                  const chip = VIEW_CHIP[view];
                  return (
                    <StatusChip tone={chip.tone} icon={chip.icon}>
                      {CURATION_LABEL[view]}
                    </StatusChip>
                  );
                },
              },
              {
                key: "visitas",
                header: "Visitas e pedidos",
                mobileLabel: "Visitas e pedidos",
                cell: (v) =>
                  v.visits === 0 && v.leads === 0 ? (
                    <span className="text-tinta-suave">Sem dados</span>
                  ) : (
                    <>
                      <span className="block">{plural(v.visits, "visita", "visitas")}</span>
                      <span className="block text-sm text-tinta-suave">{plural(v.leads, "pedido", "pedidos")}</span>
                    </>
                  ),
              },
              {
                key: "nota",
                header: "Nota",
                cell: (v) =>
                  v.reviewCount > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-4 fill-champanhe text-champanhe" aria-hidden="true" />
                      {v.rating.toFixed(1).replace(".", ",")} ({v.reviewCount})
                    </span>
                  ) : (
                    <span className="text-tinta-suave">Sem nota</span>
                  ),
              },
              {
                key: "vence",
                header: "Plano vence",
                mobileLabel: "Plano vence",
                cell: (v) =>
                  v.planTier === "FREE" ? (
                    <span className="text-tinta-suave">Sem plano pago</span>
                  ) : v.planExpiresAt ? (
                    <>
                      <span className="block">{formatDate(v.planExpiresAt)}</span>
                      <span className={planExpiryTone(v.planExpiresAt, now) === "soon" ? "block text-sm font-semibold text-aviso" : "block text-sm text-tinta-suave"}>{relativeDay(v.planExpiresAt, now)}</span>
                    </>
                  ) : (
                    <span className="text-tinta-suave">Sem vencimento</span>
                  ),
              },
            ]}
          />
          <Pagination page={list.page} pageSize={VENDOR_PAGE_SIZE} total={list.total} basePath={basePath} params={filterParams} noun={["fornecedor", "fornecedores"]} />
        </div>

        <div id="painel" className="scroll-mt-6 lg:sticky lg:top-6">
          {detail ? (
            <VendorDetailPanel detail={detail} now={now} basePath={basePath} />
          ) : (
            <Panel>
              <p className="text-sm text-tinta-suave">Escolha um fornecedor na lista para ver o perfil e decidir.</p>
            </Panel>
          )}
        </div>
      </div>

      {moderation ? (
        <Panel
          title="Avaliações denunciadas"
          aside={
            moderation.reported.length > 0 ? (
              <StatusChip tone="aviso" icon={Flag}>
                {moderation.reported.length} para moderar
              </StatusChip>
            ) : undefined
          }
        >
          {moderation.reported.length === 0 ? (
            <EmptyState icon={Flag} title="Nenhuma avaliação denunciada" compact>
              O fornecedor denuncia uma avaliação pela tela Avaliações do painel dele. Quando isso acontecer, ela aparece aqui para você decidir.
            </EmptyState>
          ) : (
            <ul className="flex flex-col">
              {moderation.reported.map((r) => (
                <li key={r.id} className="flex flex-col gap-3 border-b border-linha py-5 first:pt-0 last:border-b-0 last:pb-0">
                  <ReviewBlock review={r} now={now} />
                  <ReviewModeration reviewId={r.id} hidden={false} vendorName={r.vendorName} />
                </li>
              ))}
            </ul>
          )}
          {moderation.hidden.length > 0 ? (
            <div className="mt-6 border-t border-linha pt-5">
              <h3 className="mb-3 text-[15px] font-semibold text-tinta">Ocultadas recentemente</h3>
              <ul className="flex flex-col">
                {moderation.hidden.map((r) => (
                  <li key={r.id} className="flex flex-col gap-3 border-b border-linha py-4 first:pt-0 last:border-b-0 last:pb-0">
                    <ReviewBlock review={r} now={now} />
                    <ReviewModeration reviewId={r.id} hidden vendorName={r.vendorName} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Panel>
      ) : null}
    </>
  );
}

function ReviewBlock({ review, now }: { review: { vendorName: string; rating: number; authorName: string; comment: string; reportReason: string | null; reportedAt: Date | null; hiddenAt: Date | null }; now: Date }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="flex flex-wrap items-center gap-x-2 text-[15px]">
        <strong className="font-semibold text-tinta">{review.vendorName}</strong>
        <span className="inline-flex items-center gap-1 font-semibold text-tinta">
          <Star className="size-4 fill-champanhe text-champanhe" aria-hidden="true" />
          {review.rating} de 5
        </span>
        <span className="text-tinta-suave">por {review.authorName}</span>
      </p>
      <p className="break-words text-[15px] text-tinta">“{review.comment}”</p>
      <p className="flex flex-wrap items-center gap-2 text-sm text-tinta-suave">
        {review.hiddenAt ? (
          <StatusChip tone="neutro">Ocultada {timeAgo(review.hiddenAt, now)}</StatusChip>
        ) : (
          <StatusChip tone="aviso" icon={Flag}>
            Denunciada
          </StatusChip>
        )}
        {review.reportReason ? <span>Motivo do fornecedor: {review.reportReason}</span> : null}
      </p>
    </div>
  );
}

function VendorDetailPanel({ detail, now, basePath }: { detail: NonNullable<Awaited<ReturnType<typeof getAdminVendorDetail>>>; now: Date; basePath: string }) {
  const view = curationView(detail);
  const chip = VIEW_CHIP[view];
  const photos = galleryPhotos(detail.galleryImages, detail.coverUrl, 3);
  const days = Math.max(0, Math.floor((now.getTime() - detail.createdAt.getTime()) / 86_400_000));
  const isApproved = detail.curationStatus === "APPROVED";
  return (
    <Panel as="article">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusChip tone="salvia">{detail.category}</StatusChip>
        <StatusChip tone={chip.tone} icon={chip.icon}>
          {CURATION_LABEL[view]}
        </StatusChip>
      </div>
      <h2 className="mt-3 font-display text-[28px] leading-8 text-tinta">{detail.companyName}</h2>
      <p className="mt-1 text-sm text-tinta-suave">
        {detail.document ? `${detail.documentType ?? "Documento"} ${detail.document}` : "Documento não informado"}
        {detail.regions.length > 0 ? ` · ${detail.regions.slice(0, 2).join(", ")}` : ""} · cadastro {days === 0 ? "hoje" : `há ${plural(days, "dia", "dias")}`}
      </p>
      {detail.curationStatus === "REJECTED" && detail.curationNotes ? <p className="mt-3 rounded-xl bg-areia p-3 text-sm text-tinta">Mensagem enviada ao fornecedor: {detail.curationNotes}</p> : null}
      {detail.suspendedAt ? <p className="mt-3 rounded-xl bg-perigo-suave p-3 text-sm text-perigo">Suspenso {timeAgo(detail.suspendedAt, now)}{detail.suspendedReason ? `. Motivo: ${detail.suspendedReason}` : ""}</p> : null}
      {detail.planTier !== "FREE" && detail.planExpiresAt ? (
        <p className="mt-3 text-sm text-tinta-suave">
          Plano {detail.planTier === "PRO" ? "Pro" : "Master"} até {formatDate(detail.planExpiresAt)}.
        </p>
      ) : null}

      {photos.length > 0 ? (
        <ul className="mt-4 grid grid-cols-3 gap-2" aria-label="Fotos do portfólio">
          {photos.map((url, i) => (
            <li key={url} className="aspect-square overflow-hidden rounded-xl bg-areia">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto ${i + 1} de ${detail.companyName}`} className="size-full object-cover" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl bg-areia p-3 text-sm text-tinta-suave">Nenhuma foto enviada.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {isApproved && !detail.suspendedAt ? (
          <Link href={`/fornecedores/${detail.id}`} target="_blank" className={cn(btn.secondary, btn.sm)}>
            Ver a página pública
          </Link>
        ) : null}
        {basePath === "/admin/fornecedores" && detail.curationStatus === "PENDING_APPROVAL" ? (
          <Link href={`/admin/fornecedores/curadoria?id=${detail.id}`} className={cn(btn.secondary, btn.sm)}>
            Abrir na curadoria
          </Link>
        ) : null}
      </div>

      <div className="mt-5 border-t border-linha pt-5">
        <VendorActionsPanel
          key={detail.id}
          vendorId={detail.id}
          curation={view}
          suspended={Boolean(detail.suspendedAt)}
          featured={detail.isFeatured}
          canFeature={isApproved && !detail.suspendedAt}
          isApproved={isApproved}
        />
      </div>
    </Panel>
  );
}
