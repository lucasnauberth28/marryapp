import { NextResponse, type NextRequest } from "next/server";
import { registrarAuditoria } from "@/lib/audit";
import { protecaoDaApiDeAdminDaPlataforma } from "@/lib/security/platform-admin";
import { umDosValores, parametroDaBusca, type ParametrosDeBusca } from "@/lib/platform/list-params";
import { linhaCsv } from "@/lib/platform/csv";
import { ROTULO_DA_CURADORIA, ORDENACOES_DE_FORNECEDORES, ABAS_DE_FORNECEDORES, visaoDaCuradoria } from "@/lib/platform/vendor-admin";
import { FILTROS_DE_CURADORIA, FILTROS_DE_PLANO, listarFornecedoresDoAdminParaExportar } from "@/lib/platform/queries/fornecedores";

const MAX_ROWS = 5000;

/** Exporta os fornecedores (com os filtros da lista) em CSV. Nunca traz CPF/CNPJ, telefone nem e-mail. */
export async function GET(request: NextRequest) {
  const { ctx, response } = await protecaoDaApiDeAdminDaPlataforma();
  if (response) return response;

  const query: ParametrosDeBusca = Object.fromEntries(request.nextUrl.searchParams.entries());
  const rows = await listarFornecedoresDoAdminParaExportar(
    {
      tab: umDosValores(query, "aba", ABAS_DE_FORNECEDORES) ?? "todos",
      q: parametroDaBusca(query, "q"),
      categoria: parametroDaBusca(query, "categoria", 60),
      regiao: parametroDaBusca(query, "regiao", 60),
      plano: umDosValores(query, "plano", FILTROS_DE_PLANO),
      curadoria: umDosValores(query, "curadoria", FILTROS_DE_CURADORIA),
      ordem: umDosValores(query, "ordem", ORDENACOES_DE_FORNECEDORES) ?? "espera",
    },
    MAX_ROWS,
  );

  const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
  const lines = [
    linhaCsv(["Fornecedor", "Categoria", "Cidade", "Plano", "Plano vence", "Curadoria", "Nota", "Avaliações", "Cadastro"]),
    ...rows.map((r) => [
      r.companyName,
      r.category,
      r.city ?? "",
      r.planTier === "FREE" ? "Start" : r.planTier === "PRO" ? "Pro" : "Master",
      day(r.planExpiresAt),
      ROTULO_DA_CURADORIA[visaoDaCuradoria(r)],
      r.reviewCount > 0 ? r.rating.toFixed(1).replace(".", ",") : "",
      r.reviewCount,
      day(r.createdAt),
    ]).map(linhaCsv),
  ];

  await registrarAuditoria({ action: "export.csv", targetType: "fornecedores", details: { rows: rows.length, by: ctx.userId } });
  return new NextResponse(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="fornecedores-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
