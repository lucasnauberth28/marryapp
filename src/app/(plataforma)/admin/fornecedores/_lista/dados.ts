// Lê os filtros da URL e busca tudo que a tela de fornecedores precisa (lista, contagens, opções e resumo dos planos).
import { montarLink, umDosValores, parametroDaBusca, interpretarPagina, type ParametrosDeBusca } from "@/lib/platform/list-params";
import {
  FILTROS_DE_CURADORIA,
  FILTROS_DE_PLANO,
  obterOpcoesDeFiltroDeFornecedores,
  obterContagensDasAbasDeFornecedores,
  listarFornecedoresDoAdmin,
  type LinhaDeFornecedorDoAdmin,
} from "@/lib/platform/queries/fornecedores";
import { filtroDeFornecedorPagoAtivo } from "@/lib/platform/queries/receita";
import { ORDENACOES_DE_FORNECEDORES, ABAS_DE_FORNECEDORES } from "@/lib/platform/vendor-admin";
import prisma from "@/lib/prisma";

export type ModoDaTela = "lista" | "curadoria";

export async function carregarTelaDeFornecedores(searchParams: ParametrosDeBusca, mode: ModoDaTela, now: Date) {
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
  const filterParams = { q, categoria, regiao, plano, curadoria, ordem: ordem === "espera" ? undefined : ordem, aba: mode === "lista" && tab !== "todos" ? tab : undefined };
  const oldest = counts.curadoria > 0 ? await prisma.partnerVendor.findFirst({ where: { curationStatus: "PENDING_APPROVAL" }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }) : null;

  return {
    basePath,
    tab,
    counts,
    options,
    list,
    filterParams,
    oldestPendingAt: oldest?.createdAt ?? null,
    pro: paidGroups.find((g) => g.planTier === "PRO")?._count._all ?? 0,
    master: paidGroups.find((g) => g.planTier === "MASTER")?._count._all ?? 0,
    detailId: selectedId ?? (mode === "curadoria" ? list.rows[0]?.id : undefined),
    hasFilters: Boolean(q || categoria || regiao || plano || curadoria),
    rowHref: (row: LinhaDeFornecedorDoAdmin) => `${montarLink(basePath, { ...filterParams, pagina: list.page > 1 ? list.page : undefined, id: row.id })}#painel`,
  };
}

export type TelaDeFornecedores = Awaited<ReturnType<typeof carregarTelaDeFornecedores>>;
