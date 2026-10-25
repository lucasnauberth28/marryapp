import { Suspense } from "react";
import Link from "next/link";
import { Check, Clock, Download, Flag, Pencil, ShieldCheck, Star, Store, Ban } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { BotaoDeExportar } from "@/components/plataforma/export-button";
import { BarraDeFiltros } from "@/components/plataforma/filter-bar";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { Paginacao } from "@/components/plataforma/pagination";
import { RegiaoPendente } from "@/components/plataforma/pending";
import { EsqueletoDoPainelLateral } from "@/components/plataforma/loading-parts";
import { EsqueletoDeCartao, EsqueletoDeTexto } from "@/components/skeletons";
import { Painel } from "@/components/plataforma/panel";
import { TabelaResponsiva } from "@/components/plataforma/responsive-table";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import { EtiquetaDePlano, EtiquetaDeSituacao, type TomDaSituacao } from "@/components/plataforma/status-chip";
import { NavegacaoDeAbas } from "@/components/plataforma/tabs-nav";
import { formatarData, formatarInteiro, diaRelativo, haQuantoTempo } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { montarLink, umDosValores, parametroDaBusca, interpretarPagina, type ParametrosDeBusca } from "@/lib/platform/list-params";
import {
  FILTROS_DE_CURADORIA,
  FILTROS_DE_PLANO,
  TAMANHO_DA_PAGINA_DE_FORNECEDORES,
  obterDetalheDoFornecedorDoAdmin,
  obterAvaliacoesParaModerar,
  obterOpcoesDeFiltroDeFornecedores,
  obterContagensDasAbasDeFornecedores,
  listarFornecedoresDoAdmin,
  type LinhaDeFornecedorDoAdmin,
} from "@/lib/platform/queries/fornecedores";
import { filtroDeFornecedorPagoAtivo } from "@/lib/platform/queries/receita";
import { ROTULO_DA_CURADORIA, ORDENACOES_DE_FORNECEDORES, ABAS_DE_FORNECEDORES, visaoDaCuradoria, fotosDaGaleria, tomDoVencimentoDoPlano, type VisaoDaCuradoria } from "@/lib/platform/vendor-admin";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { PainelDeAcoesDoFornecedor } from "./vendor-actions-panel";
import { ModeracaoDeAvaliacao } from "./review-moderation";

const ETIQUETA_DA_VISAO: Record<VisaoDaCuradoria, { tone: TomDaSituacao; icon: typeof Check }> = {
  approved: { tone: "sucesso", icon: Check },
  pending: { tone: "aviso", icon: Clock },
  adjust: { tone: "neutro", icon: Pencil },
  suspended: { tone: "perigo", icon: Ban },
};

const ROTULO_DA_ABA: Record<(typeof ABAS_DE_FORNECEDORES)[number], string> = {
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
export async function TelaDeFornecedores({ searchParams, mode }: { searchParams: ParametrosDeBusca; mode: "lista" | "curadoria" }) {
  const now = new Date();
  const basePath = mode === "curadoria" ? "/admin/fornecedores/curadoria" : "/admin/fornecedores";
  const tab = mode === "curadoria" ? "curadoria" : (umDosValores(searchParams, "aba", ABAS_DE_FORNECEDORES) ?? "todos");
  const q = parametroDaBusca(searchParams, "q");
  const categoria = parametroDaBusca(searchParams, "categoria", 60);
  const regiao = parametroDaBusca(searchParams, "regiao", 60);
  const plano = umDosValores(searchParams, "plano", FILTROS_DE_PLANO);
  const curadoria = umDosValores(searchParams, "curadoria", FILTROS_DE_CURADORIA);
  const ordem = umDosValores(searchParams, "ordem", ORDENACOES_DE_FORNECEDORES) ?? "espera";
  const selectedId = parametroDaBusca(searchParams, "id", 40);

  const [counts, paidGroups, options, list] = await Promise.all([
    obterContagensDasAbasDeFornecedores(now),
    prisma.partnerVendor.groupBy({ by: ["planTier"], where: filtroDeFornecedorPagoAtivo(now), _count: { _all: true } }),
    obterOpcoesDeFiltroDeFornecedores(),
    listarFornecedoresDoAdmin({ tab, q, categoria, plano, curadoria, regiao, ordem, page: interpretarPagina(searchParams) }, now),
  ]);

  const pro = paidGroups.find((g) => g.planTier === "PRO")?._count._all ?? 0;
  const master = paidGroups.find((g) => g.planTier === "MASTER")?._count._all ?? 0;
  const detailId = selectedId ?? (mode === "curadoria" ? list.rows[0]?.id : undefined);

  const filterParams = { q, categoria, regiao, plano, curadoria, ordem: ordem === "espera" ? undefined : ordem, aba: mode === "lista" && tab !== "todos" ? tab : undefined };
  const rowHref = (row: LinhaDeFornecedorDoAdmin) => `${montarLink(basePath, { ...filterParams, pagina: list.page > 1 ? list.page : undefined, id: row.id })}#painel`;

  const oldest = counts.curadoria > 0 ? await prisma.partnerVendor.findFirst({ where: { curationStatus: "PENDING_APPROVAL" }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }) : null;

  const description =
    mode === "curadoria"
      ? counts.curadoria === 0
        ? "Nenhum cadastro esperando análise."
        : `${pluralizar(counts.curadoria, "cadastro esperando", "cadastros esperando")} análise${oldest ? `, o mais antigo ${haQuantoTempo(oldest.createdAt, now)}` : ""}.`
      : `${pluralizar(counts.todos, "fornecedor", "fornecedores")}, ${formatarInteiro(pro + master)} com plano pago (${formatarInteiro(pro)} Pro e ${formatarInteiro(master)} Master).`;

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
      <CabecalhoDaPagina
        breadcrumb={mode === "curadoria" ? [{ label: "Fornecedores", href: "/admin/fornecedores" }, { label: "Curadoria" }] : undefined}
        eyebrow="Casais e fornecedores"
        title={mode === "curadoria" ? "Curadoria" : "Fornecedores"}
        description={description}
        actions={
          mode === "lista" ? (
            <>
              <Link href="/admin/fornecedores/curadoria" className={estiloDoBotao.secondary}>
                <ShieldCheck className="size-4" aria-hidden="true" /> Curadoria
              </Link>
              <BotaoDeExportar href={montarLink("/api/admin/fornecedores.csv", filterParams)} fallbackName="fornecedores.csv">
                <Download className="size-4" aria-hidden="true" /> Exportar CSV
              </BotaoDeExportar>
            </>
          ) : (
            <Link href="/admin/fornecedores" className={estiloDoBotao.secondary}>
              <Store className="size-4" aria-hidden="true" /> Todos os fornecedores
            </Link>
          )
        }
      />

      {mode === "lista" ? (
        <NavegacaoDeAbas
          label="Fornecedores"
          basePath={basePath}
          active={tab}
          params={{ q, categoria, regiao, plano, curadoria, ordem: ordem === "espera" ? undefined : ordem }}
          tabs={ABAS_DE_FORNECEDORES.map((value) => ({ value, label: ROTULO_DA_ABA[value], count: counts[value] }))}
        />
      ) : null}

      <BarraDeFiltros searchPlaceholder="Buscar por nome, categoria ou cidade" filters={mode === "curadoria" ? filters.filter((f) => f.key === "categoria" || f.key === "ordem") : filters} />

      <RegiaoPendente>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <TabelaResponsiva
            caption="Fornecedores"
            rows={list.rows}
            rowKey={(r) => r.id}
            rowHref={rowHref}
            selectedKey={detailId}
            empty={
              <EstadoVazio icon={Store} title={hasFilters || tab !== "todos" ? "Nenhum fornecedor com esses filtros" : "Ainda não tem fornecedor aqui"} compact>
                {hasFilters || tab !== "todos"
                  ? "Tente limpar os filtros ou escolher outra aba."
                  : "Quando um fornecedor se cadastrar, ele aparece nesta lista para a curadoria."}
              </EstadoVazio>
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
              { key: "plano", header: "Plano", cell: (v) => <EtiquetaDePlano plan={v.planTier} /> },
              {
                key: "curadoria",
                header: "Curadoria",
                cell: (v) => {
                  const view = visaoDaCuradoria(v);
                  const chip = ETIQUETA_DA_VISAO[view];
                  return (
                    <EtiquetaDeSituacao tone={chip.tone} icon={chip.icon}>
                      {ROTULO_DA_CURADORIA[view]}
                    </EtiquetaDeSituacao>
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
                      <span className="block">{pluralizar(v.visits, "visita", "visitas")}</span>
                      <span className="block text-sm text-tinta-suave">{pluralizar(v.leads, "pedido", "pedidos")}</span>
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
                      <span className="block">{formatarData(v.planExpiresAt)}</span>
                      <span className={tomDoVencimentoDoPlano(v.planExpiresAt, now) === "soon" ? "block text-sm font-semibold text-aviso" : "block text-sm text-tinta-suave"}>{diaRelativo(v.planExpiresAt, now)}</span>
                    </>
                  ) : (
                    <span className="text-tinta-suave">Sem vencimento</span>
                  ),
              },
            ]}
          />
          <Paginacao page={list.page} pageSize={TAMANHO_DA_PAGINA_DE_FORNECEDORES} total={list.total} basePath={basePath} params={filterParams} noun={["fornecedor", "fornecedores"]} />
        </div>

        <div id="painel" className="scroll-mt-6 lg:sticky lg:top-6">
          {/* O painel busca o fornecedor escolhido sozinho: a lista não espera por ele (key = fornecedor) */}
          <Suspense key={detailId ?? "nenhum"} fallback={<EsqueletoDoPainelLateral photos />}>
            <AreaDoDetalheDoFornecedor detailId={detailId} now={now} basePath={basePath} />
          </Suspense>
        </div>
      </div>
      </RegiaoPendente>

      {mode === "lista" ? (
        <Suspense
          fallback={
            <EsqueletoDeCartao>
              <EsqueletoDeTexto lines={2} />
            </EsqueletoDeCartao>
          }
        >
          <BlocoDeModeracao now={now} />
        </Suspense>
      ) : null}
    </>
  );
}

async function AreaDoDetalheDoFornecedor({ detailId, now, basePath }: { detailId: string | undefined; now: Date; basePath: string }) {
  const detail = detailId ? await obterDetalheDoFornecedorDoAdmin(detailId) : null;
  return detail ? (
    <PainelDoDetalheDoFornecedor detail={detail} now={now} basePath={basePath} />
  ) : (
    <Painel>
      <p className="text-sm text-tinta-suave">Escolha um fornecedor na lista para ver o perfil e decidir.</p>
    </Painel>
  );
}

async function BlocoDeModeracao({ now }: { now: Date }) {
  const moderation = await obterAvaliacoesParaModerar();
  return (
    <>
      {moderation ? (
        <Painel
          title="Avaliações denunciadas"
          aside={
            moderation.reported.length > 0 ? (
              <EtiquetaDeSituacao tone="aviso" icon={Flag}>
                {moderation.reported.length} para moderar
              </EtiquetaDeSituacao>
            ) : undefined
          }
        >
          {moderation.reported.length === 0 ? (
            <EstadoVazio icon={Flag} title="Nenhuma avaliação denunciada" compact>
              O fornecedor denuncia uma avaliação pela tela Avaliações do painel dele. Quando isso acontecer, ela aparece aqui para você decidir.
            </EstadoVazio>
          ) : (
            <ul className="flex flex-col">
              {moderation.reported.map((r) => (
                <li key={r.id} className="flex flex-col gap-3 border-b border-linha py-5 first:pt-0 last:border-b-0 last:pb-0">
                  <BlocoDeAvaliacao review={r} now={now} />
                  <ModeracaoDeAvaliacao reviewId={r.id} hidden={false} vendorName={r.vendorName} />
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
                    <BlocoDeAvaliacao review={r} now={now} />
                    <ModeracaoDeAvaliacao reviewId={r.id} hidden vendorName={r.vendorName} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Painel>
      ) : null}
    </>
  );
}

function BlocoDeAvaliacao({ review, now }: { review: { vendorName: string; rating: number; authorName: string; comment: string; reportReason: string | null; reportedAt: Date | null; hiddenAt: Date | null }; now: Date }) {
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
          <EtiquetaDeSituacao tone="neutro">Ocultada {haQuantoTempo(review.hiddenAt, now)}</EtiquetaDeSituacao>
        ) : (
          <EtiquetaDeSituacao tone="aviso" icon={Flag}>
            Denunciada
          </EtiquetaDeSituacao>
        )}
        {review.reportReason ? <span>Motivo do fornecedor: {review.reportReason}</span> : null}
      </p>
    </div>
  );
}

function PainelDoDetalheDoFornecedor({ detail, now, basePath }: { detail: NonNullable<Awaited<ReturnType<typeof obterDetalheDoFornecedorDoAdmin>>>; now: Date; basePath: string }) {
  const view = visaoDaCuradoria(detail);
  const chip = ETIQUETA_DA_VISAO[view];
  const photos = fotosDaGaleria(detail.galleryImages, detail.coverUrl, 3);
  const days = Math.max(0, Math.floor((now.getTime() - detail.createdAt.getTime()) / 86_400_000));
  const isApproved = detail.curationStatus === "APPROVED";
  return (
    <Painel as="article">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <EtiquetaDeSituacao tone="salvia">{detail.category}</EtiquetaDeSituacao>
        <EtiquetaDeSituacao tone={chip.tone} icon={chip.icon}>
          {ROTULO_DA_CURADORIA[view]}
        </EtiquetaDeSituacao>
      </div>
      <h2 className="mt-3 font-display text-[28px] leading-8 text-tinta">{detail.companyName}</h2>
      <p className="mt-1 text-sm text-tinta-suave">
        {detail.document ? `${detail.documentType ?? "Documento"} ${detail.document}` : "Documento não informado"}
        {detail.regions.length > 0 ? ` · ${detail.regions.slice(0, 2).join(", ")}` : ""} · cadastro {days === 0 ? "hoje" : `há ${pluralizar(days, "dia", "dias")}`}
      </p>
      {detail.curationStatus === "REJECTED" && detail.curationNotes ? <p className="mt-3 rounded-xl bg-areia p-3 text-sm text-tinta">Mensagem enviada ao fornecedor: {detail.curationNotes}</p> : null}
      {detail.suspendedAt ? <p className="mt-3 rounded-xl bg-perigo-suave p-3 text-sm text-perigo">Suspenso {haQuantoTempo(detail.suspendedAt, now)}{detail.suspendedReason ? `. Motivo: ${detail.suspendedReason}` : ""}</p> : null}
      {detail.planTier !== "FREE" && detail.planExpiresAt ? (
        <p className="mt-3 text-sm text-tinta-suave">
          Plano {detail.planTier === "PRO" ? "Pro" : "Master"} até {formatarData(detail.planExpiresAt)}.
        </p>
      ) : null}

      {photos.length > 0 ? (
        <ul className="mt-4 grid grid-cols-3 gap-2" aria-label="Fotos do portfólio">
          {photos.map((url, i) => (
            <li key={url} className="relative aspect-square overflow-hidden rounded-xl bg-areia">
              <ImagemDaPessoa src={url} alt={`Foto ${i + 1} de ${detail.companyName}`} sizes="120px" className="object-cover" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl bg-areia p-3 text-sm text-tinta-suave">Nenhuma foto enviada.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {isApproved && !detail.suspendedAt ? (
          <Link href={`/fornecedores/${detail.id}`} target="_blank" className={cn(estiloDoBotao.secondary, estiloDoBotao.sm)}>
            Ver a página pública
          </Link>
        ) : null}
        {basePath === "/admin/fornecedores" && detail.curationStatus === "PENDING_APPROVAL" ? (
          <Link href={`/admin/fornecedores/curadoria?id=${detail.id}`} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm)}>
            Abrir na curadoria
          </Link>
        ) : null}
      </div>

      <div className="mt-5 border-t border-linha pt-5">
        <PainelDeAcoesDoFornecedor
          key={detail.id}
          vendorId={detail.id}
          curation={view}
          suspended={Boolean(detail.suspendedAt)}
          featured={detail.isFeatured}
          canFeature={isApproved && !detail.suspendedAt}
          isApproved={isApproved}
        />
      </div>
    </Painel>
  );
}
