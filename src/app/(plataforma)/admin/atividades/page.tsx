import Link from "next/link";
import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/plataforma/page-header";
import { FilterBar } from "@/components/plataforma/filter-bar";
import { Pagination } from "@/components/plataforma/pagination";
import { ResponsiveTable } from "@/components/plataforma/responsive-table";
import { EmptyState } from "@/components/plataforma/empty-state";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";
import { DEFAULT_PAGE_SIZE, type SearchParams, oneOf, pageWindow, param, parsePage } from "@/lib/platform/list-params";
import { formatDateTime } from "@/lib/platform/format";
import { ACTIVITY_GROUPS, ACTIVITY_GROUP_VALUES, actionLabel, parseTarget, summarizeDetails, targetHref, targetLabel } from "@/lib/platform/activity";
import { PERIODS, listActivity, targetCaption } from "@/lib/platform/queries/atividades";

export const metadata = { title: "Registro de atividades" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const group = oneOf(query, "tipo", ACTIVITY_GROUP_VALUES);
  const period = oneOf(query, "periodo", PERIODS);
  const q = param(query, "q", 100)?.trim() || undefined;
  const target = parseTarget(param(query, "alvo", 140));
  const win = pageWindow(parsePage(query), DEFAULT_PAGE_SIZE);
  const [{ rows, total }, caption] = await Promise.all([listActivity({ group, period, q, target }, win.skip, win.take), targetCaption(target)]);
  const filtered = Boolean(group || period || q || target);

  return (
    <>
      <PageHeader eyebrow="Sistema" title="Registro de atividades" description="O que a administração fez por aqui: pagamentos, casais, fornecedores, comunicados, configurações e acessos. Só leitura." />

      <FilterBar
        searchPlaceholder="Buscar por quem fez"
        filters={[
          { key: "tipo", label: "Tipo", allLabel: "Todos", options: ACTIVITY_GROUPS.map((g) => ({ value: g.value, label: g.label })) },
          { key: "periodo", label: "Período", allLabel: "Desde o começo", options: [{ value: "7d", label: "Últimos 7 dias" }, { value: "30d", label: "Últimos 30 dias" }, { value: "90d", label: "Últimos 90 dias" }] },
        ]}
      />

      {target && (
        <p className="flex flex-wrap items-center gap-2 rounded-xl bg-ameixa-suave px-4 py-2.5 text-sm leading-5 text-tinta">
          <span>
            Mostrando só o que aconteceu com {targetLabel(target.type)?.toLowerCase()}
            {caption ? <strong className="font-semibold"> {caption}</strong> : null}.
          </span>
          <Link href="/admin/atividades" className="font-semibold text-ameixa underline underline-offset-2">
            Ver tudo no registro
          </Link>
        </p>
      )}

      <ResponsiveTable
        caption="Atividades, da mais recente para a mais antiga"
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { key: "when", header: "Quando", mobileLabel: false, cell: (r) => <span className="whitespace-nowrap text-sm text-tinta-suave">{formatDateTime(r.createdAt)}</span> },
          { key: "who", header: "Quem", mobileLabel: "Quem", cell: (r) => r.actorName ?? "Sem login" },
          {
            key: "what",
            header: "O que fez",
            primary: true,
            cell: (r) => {
              const href = targetHref(r.targetType, r.targetId);
              const label = targetLabel(r.targetType);
              return (
                <span className="flex flex-col">
                  <span className="font-semibold text-tinta">{actionLabel(r.action)}</span>
                  {label && (href ? <Link href={href} className="relative text-[13px] text-ameixa underline underline-offset-2">{label}</Link> : <span className="text-[13px] text-tinta-suave">{label}</span>)}
                </span>
              );
            },
          },
          { key: "details", header: "Detalhes", mobileLabel: false, cell: (r) => <span className="break-words text-sm text-tinta-suave">{summarizeDetails(r.details, r.action, r.targetId) || "Sem detalhes"}</span> },
        ]}
        empty={
          filtered ? (
            <EmptyState icon={ScrollText} compact title="Nada com esses filtros">
              Tente outro tipo ou período.
            </EmptyState>
          ) : (
            <EmptyState icon={ScrollText} compact title="Nada registrado ainda">
              As próximas ações da administração aparecem aqui.
            </EmptyState>
          )
        }
      />

      <Pagination page={win.page} pageSize={DEFAULT_PAGE_SIZE} total={total} basePath="/admin/atividades" params={{ tipo: group, periodo: period, q, alvo: target ? `${target.type}:${target.id}` : undefined }} noun={["atividade", "atividades"]} />
    </>
  );
}
