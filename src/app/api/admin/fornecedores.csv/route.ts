import { NextResponse, type NextRequest } from "next/server";
import { registrarAuditoria } from "@/lib/audit";
import { platformAdminApiGuard } from "@/lib/security/platform-admin";
import { oneOf, param, type SearchParams } from "@/lib/platform/list-params";
import { csvLine } from "@/lib/platform/csv";
import { CURATION_LABEL, VENDOR_SORTS, VENDOR_TABS, curationView } from "@/lib/platform/vendor-admin";
import { CURATION_FILTERS, PLAN_FILTERS, listAdminVendorsForExport } from "@/lib/platform/queries/fornecedores";

const MAX_ROWS = 5000;

/** Exporta os fornecedores (com os filtros da lista) em CSV. Nunca traz CPF/CNPJ, telefone nem e-mail. */
export async function GET(request: NextRequest) {
  const { ctx, response } = await platformAdminApiGuard();
  if (response) return response;

  const query: SearchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const rows = await listAdminVendorsForExport(
    {
      tab: oneOf(query, "aba", VENDOR_TABS) ?? "todos",
      q: param(query, "q"),
      categoria: param(query, "categoria", 60),
      regiao: param(query, "regiao", 60),
      plano: oneOf(query, "plano", PLAN_FILTERS),
      curadoria: oneOf(query, "curadoria", CURATION_FILTERS),
      ordem: oneOf(query, "ordem", VENDOR_SORTS) ?? "espera",
    },
    MAX_ROWS,
  );

  const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
  const lines = [
    csvLine(["Fornecedor", "Categoria", "Cidade", "Plano", "Plano vence", "Curadoria", "Nota", "Avaliações", "Cadastro"]),
    ...rows.map((r) => [
      r.companyName,
      r.category,
      r.city ?? "",
      r.planTier === "FREE" ? "Start" : r.planTier === "PRO" ? "Pro" : "Master",
      day(r.planExpiresAt),
      CURATION_LABEL[curationView(r)],
      r.reviewCount > 0 ? r.rating.toFixed(1).replace(".", ",") : "",
      r.reviewCount,
      day(r.createdAt),
    ]).map(csvLine),
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
