import Link from "next/link";
import { ScrollText } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { BarraDeFiltros } from "@/components/plataforma/filter-bar";
import { RegiaoPendente } from "@/components/plataforma/pending";
import { Paginacao } from "@/components/plataforma/pagination";
import { TabelaResponsiva } from "@/components/plataforma/responsive-table";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { TAMANHO_PADRAO_DA_PAGINA, type ParametrosDeBusca, umDosValores, janelaDaPagina, parametroDaBusca, interpretarPagina } from "@/lib/platform/list-params";
import { formatarDataEHora } from "@/lib/platform/format";
import { GRUPOS_DE_ATIVIDADE, VALORES_DOS_GRUPOS_DE_ATIVIDADE, rotuloDaAcao, interpretarAlvo, resumirDetalhes, linkDoAlvo, rotuloDoAlvo } from "@/lib/platform/activity";
import { PERIODOS, listarAtividades, legendaDoAlvo } from "@/lib/platform/queries/atividades";

export const metadata = { title: "Registro de atividades" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const group = umDosValores(query, "tipo", VALORES_DOS_GRUPOS_DE_ATIVIDADE);
  const period = umDosValores(query, "periodo", PERIODOS);
  const q = parametroDaBusca(query, "q", 100)?.trim() || undefined;
  const target = interpretarAlvo(parametroDaBusca(query, "alvo", 140));
  const win = janelaDaPagina(interpretarPagina(query), TAMANHO_PADRAO_DA_PAGINA);
  const [{ rows, total }, caption] = await Promise.all([listarAtividades({ group, period, q, target }, win.skip, win.take), legendaDoAlvo(target)]);
  const filtered = Boolean(group || period || q || target);

  return (
    <>
      <CabecalhoDaPagina eyebrow="Sistema" title="Registro de atividades" description="O que a administração fez por aqui: pagamentos, casais, fornecedores, comunicados, configurações e acessos. Só leitura." />

      <BarraDeFiltros
        searchPlaceholder="Buscar por quem fez"
        filters={[
          { key: "tipo", label: "Tipo", allLabel: "Todos", options: GRUPOS_DE_ATIVIDADE.map((g) => ({ value: g.value, label: g.label })) },
          { key: "periodo", label: "Período", allLabel: "Desde o começo", options: [{ value: "7d", label: "Últimos 7 dias" }, { value: "30d", label: "Últimos 30 dias" }, { value: "90d", label: "Últimos 90 dias" }] },
        ]}
      />

      {target && (
        <p className="flex flex-wrap items-center gap-2 rounded-xl bg-ameixa-suave px-4 py-2.5 text-sm leading-5 text-tinta">
          <span>
            Mostrando só o que aconteceu com {rotuloDoAlvo(target.type)?.toLowerCase()}
            {caption ? <strong className="font-semibold"> {caption}</strong> : null}.
          </span>
          <Link href="/admin/atividades" className="font-semibold text-ameixa underline underline-offset-2">
            Ver tudo no registro
          </Link>
        </p>
      )}

      <RegiaoPendente className="flex flex-col gap-6">
      <TabelaResponsiva
        caption="Atividades, da mais recente para a mais antiga"
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { key: "when", header: "Quando", mobileLabel: false, cell: (r) => <span className="whitespace-nowrap text-sm text-tinta-suave">{formatarDataEHora(r.createdAt)}</span> },
          { key: "who", header: "Quem", mobileLabel: "Quem", cell: (r) => r.actorName ?? "Sem login" },
          {
            key: "what",
            header: "O que fez",
            primary: true,
            cell: (r) => {
              const href = linkDoAlvo(r.targetType, r.targetId);
              const label = rotuloDoAlvo(r.targetType);
              return (
                <span className="flex flex-col">
                  <span className="font-semibold text-tinta">{rotuloDaAcao(r.action)}</span>
                  {label && (href ? <Link href={href} className="relative text-[13px] text-ameixa underline underline-offset-2">{label}</Link> : <span className="text-[13px] text-tinta-suave">{label}</span>)}
                </span>
              );
            },
          },
          { key: "details", header: "Detalhes", mobileLabel: false, cell: (r) => <span className="break-words text-sm text-tinta-suave">{resumirDetalhes(r.details, r.action, r.targetId) || "Sem detalhes"}</span> },
        ]}
        empty={
          filtered ? (
            <EstadoVazio icon={ScrollText} compact title="Nada com esses filtros">
              Tente outro tipo ou período.
            </EstadoVazio>
          ) : (
            <EstadoVazio icon={ScrollText} compact title="Nada registrado ainda">
              As próximas ações da administração aparecem aqui.
            </EstadoVazio>
          )
        }
      />

      <Paginacao page={win.page} pageSize={TAMANHO_PADRAO_DA_PAGINA} total={total} basePath="/admin/atividades" params={{ tipo: group, periodo: period, q, alvo: target ? `${target.type}:${target.id}` : undefined }} noun={["atividade", "atividades"]} />
      </RegiaoPendente>
    </>
  );
}
