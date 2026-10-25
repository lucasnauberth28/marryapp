import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { registrarAuditoria } from "@/lib/audit";
import { protecaoDaApiDeAdminDaPlataforma } from "@/lib/security/platform-admin";
import { umDosValores, parametroDaBusca, type ParametrosDeBusca } from "@/lib/platform/list-params";
import { FILTROS_DE_ATIVIDADE, ABAS_DE_CASAIS, FILTROS_DE_DATA, FILTROS_DE_DOMINIO, FILTROS_DE_INICIO, FILTROS_DE_PLANO, type FiltrosDeCasais } from "@/lib/platform/casais-filters";
import { ORDENACOES_DE_CASAIS, listarCasaisParaExportar } from "@/lib/platform/queries/casais/lista";
import { idsDeCasamentoDoPlano } from "@/lib/platform/queries/casais/planos";
import { linhaCsv } from "@/lib/platform/csv";
import { ROTULO_DA_SITUACAO } from "@/lib/platform/casal-status";

const MAXIMO_DE_LINHAS = 5000;

/** Exporta os casais (da lista filtrada ou só os selecionados) em CSV. Nunca traz documento, telefone nem dado de convidado. */
export async function GET(request: NextRequest) {
  const { ctx, response } = await protecaoDaApiDeAdminDaPlataforma();
  if (response) return response;

  const query: ParametrosDeBusca = Object.fromEntries(request.nextUrl.searchParams.entries());
  const ids = z.array(z.string().uuid()).max(200).safeParse((parametroDaBusca(query, "ids", 8000) ?? "").split(",").filter(Boolean));
  if (!ids.success) return NextResponse.json({ error: "Seleção inválida." }, { status: 400 });

  const plano = umDosValores(query, "plano", FILTROS_DE_PLANO);
  const filters: FiltrosDeCasais = {
    tab: umDosValores(query, "aba", ABAS_DE_CASAIS) ?? "todos",
    q: parametroDaBusca(query, "q"),
    data: umDosValores(query, "data", FILTROS_DE_DATA),
    onboarding: umDosValores(query, "onboarding", FILTROS_DE_INICIO),
    atividade: umDosValores(query, "atividade", FILTROS_DE_ATIVIDADE),
    dominio: umDosValores(query, "dominio", FILTROS_DE_DOMINIO),
    acompanhar: parametroDaBusca(query, "acompanhar") === "marcados",
    planIds: plano ? await idsDeCasamentoDoPlano(plano) : undefined,
  };
  const rows = await listarCasaisParaExportar({ filters, order: umDosValores(query, "ordem", ORDENACOES_DE_CASAIS) ?? "recentes", ids: ids.data.length ? ids.data : undefined, limit: MAXIMO_DE_LINHAS });

  const fmt = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
  const lines = [
    linhaCsv(["Casal", "E-mail do dono", "Endereço do site", "Data do casamento", "Cidade", "Plano", "Convidados", "Presentes recebidos (R$)", "Última atividade", "Cadastro", "Situação"]),
    ...rows.map((r) =>
      linhaCsv([r.coupleNames, r.email, r.slug, fmt(r.weddingDate), r.city ?? "", r.planId ?? "basic", r.guests, (r.giftsCents / 100).toFixed(2).replace(".", ","), fmt(r.lastActiveAt), fmt(r.createdAt), ROTULO_DA_SITUACAO[r.situation]]),
    ),
  ];

  await registrarAuditoria({ action: "export.csv", targetType: "casais", details: { rows: rows.length, selection: ids.data.length, by: ctx.userId } });
  return new NextResponse(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="casais-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
