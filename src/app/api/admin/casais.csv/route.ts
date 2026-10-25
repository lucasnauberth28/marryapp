import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { registrarAuditoria } from "@/lib/audit";
import { protecaoDaApiDeAdminDaPlataforma } from "@/lib/security/platform-admin";
import { oneOf, param, type SearchParams } from "@/lib/platform/list-params";
import { ATIVIDADE_FILTERS, CASAIS_TABS, DATA_FILTERS, DOMINIO_FILTERS, ONBOARDING_FILTERS, PLANO_FILTERS, type CasaisFilters } from "@/lib/platform/casais-filters";
import { CASAIS_ORDERS, listCasaisForExport, weddingIdsForPlan } from "@/lib/platform/queries/casais";
import { csvLine } from "@/lib/platform/csv";
import { SITUATION_LABEL } from "@/lib/platform/casal-status";

const MAX_ROWS = 5000;

/** Exporta os casais (da lista filtrada ou só os selecionados) em CSV. Nunca traz documento, telefone nem dado de convidado. */
export async function GET(request: NextRequest) {
  const { ctx, response } = await protecaoDaApiDeAdminDaPlataforma();
  if (response) return response;

  const query: SearchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const ids = z.array(z.string().uuid()).max(200).safeParse((param(query, "ids", 8000) ?? "").split(",").filter(Boolean));
  if (!ids.success) return NextResponse.json({ error: "Seleção inválida." }, { status: 400 });

  const plano = oneOf(query, "plano", PLANO_FILTERS);
  const filters: CasaisFilters = {
    tab: oneOf(query, "aba", CASAIS_TABS) ?? "todos",
    q: param(query, "q"),
    data: oneOf(query, "data", DATA_FILTERS),
    onboarding: oneOf(query, "onboarding", ONBOARDING_FILTERS),
    atividade: oneOf(query, "atividade", ATIVIDADE_FILTERS),
    dominio: oneOf(query, "dominio", DOMINIO_FILTERS),
    acompanhar: param(query, "acompanhar") === "marcados",
    planIds: plano ? await weddingIdsForPlan(plano) : undefined,
  };
  const rows = await listCasaisForExport({ filters, order: oneOf(query, "ordem", CASAIS_ORDERS) ?? "recentes", ids: ids.data.length ? ids.data : undefined, limit: MAX_ROWS });

  const fmt = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
  const lines = [
    csvLine(["Casal", "E-mail do dono", "Endereço do site", "Data do casamento", "Cidade", "Plano", "Convidados", "Presentes recebidos (R$)", "Última atividade", "Cadastro", "Situação"]),
    ...rows.map((r) =>
      csvLine([r.coupleNames, r.email, r.slug, fmt(r.weddingDate), r.city ?? "", r.planId ?? "basic", r.guests, (r.giftsCents / 100).toFixed(2).replace(".", ","), fmt(r.lastActiveAt), fmt(r.createdAt), SITUATION_LABEL[r.situation]]),
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
