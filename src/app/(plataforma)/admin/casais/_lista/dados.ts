// Lê os filtros da URL e busca a página de casais já em texto simples (datas em ISO), pronta para o navegador.
import { type ParametrosDeBusca, umDosValores, parametroDaBusca, interpretarPagina, TAMANHO_PADRAO_DA_PAGINA } from "@/lib/platform/list-params";
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
import type { LinhaDaListaDeCasais } from "../_components/casais-list";

const ACOMPANHAR_DE_PERTO = ["marcados"] as const;

type ResultadoDaLista = Awaited<ReturnType<typeof listarCasais>>;

function linhaEmTexto(r: ResultadoDaLista["rows"][number]): LinhaDaListaDeCasais {
  return {
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
  };
}

export async function carregarListaDeCasais(query: ParametrosDeBusca) {
  const tab = umDosValores(query, "aba", ABAS_DE_CASAIS) ?? "todos";
  const q = parametroDaBusca(query, "q");
  const plano = umDosValores(query, "plano", FILTROS_DE_PLANO);
  const data = umDosValores(query, "data", FILTROS_DE_DATA);
  const onboarding = umDosValores(query, "onboarding", FILTROS_DE_INICIO);
  const atividade = umDosValores(query, "atividade", FILTROS_DE_ATIVIDADE);
  const dominio = umDosValores(query, "dominio", FILTROS_DE_DOMINIO);
  const acompanhar = umDosValores(query, "acompanhar", ACOMPANHAR_DE_PERTO);
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
  return { tab, counts, result, active, rows: result.rows.map(linhaEmTexto) };
}
