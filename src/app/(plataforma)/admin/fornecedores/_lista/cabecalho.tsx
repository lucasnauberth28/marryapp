import Link from "next/link";
import { Download, ShieldCheck, Store } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { BotaoDeExportar } from "@/components/plataforma/export-button";
import { BarraDeFiltros } from "@/components/plataforma/filter-bar";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { formatarInteiro, haQuantoTempo } from "@/lib/platform/format";
import { montarLink } from "@/lib/platform/list-params";
import { pluralizar } from "@/lib/formatacao/plural";
import type { ModoDaTela, TelaDeFornecedores } from "./dados";

function descricaoDaTela(tela: TelaDeFornecedores, mode: ModoDaTela, now: Date) {
  const { counts, pro, master, oldestPendingAt } = tela;
  if (mode === "lista") return `${pluralizar(counts.todos, "fornecedor", "fornecedores")}, ${formatarInteiro(pro + master)} com plano pago (${formatarInteiro(pro)} Pro e ${formatarInteiro(master)} Master).`;
  if (counts.curadoria === 0) return "Nenhum cadastro esperando análise.";
  return `${pluralizar(counts.curadoria, "cadastro esperando", "cadastros esperando")} análise${oldestPendingAt ? `, o mais antigo ${haQuantoTempo(oldestPendingAt, now)}` : ""}.`;
}

function AcoesDoCabecalho({ mode, filterParams }: { mode: ModoDaTela; filterParams: TelaDeFornecedores["filterParams"] }) {
  if (mode === "curadoria") {
    return (
      <Link href="/admin/fornecedores" className={estiloDoBotao.secondary}>
        <Store className="size-4" aria-hidden="true" /> Todos os fornecedores
      </Link>
    );
  }
  return (
    <>
      <Link href="/admin/fornecedores/curadoria" className={estiloDoBotao.secondary}>
        <ShieldCheck className="size-4" aria-hidden="true" /> Curadoria
      </Link>
      <BotaoDeExportar href={montarLink("/api/admin/fornecedores.csv", filterParams)} fallbackName="fornecedores.csv">
        <Download className="size-4" aria-hidden="true" /> Exportar CSV
      </BotaoDeExportar>
    </>
  );
}

export function CabecalhoDeFornecedores({ tela, mode, now }: { tela: TelaDeFornecedores; mode: ModoDaTela; now: Date }) {
  return (
    <CabecalhoDaPagina
      breadcrumb={mode === "curadoria" ? [{ label: "Fornecedores", href: "/admin/fornecedores" }, { label: "Curadoria" }] : undefined}
      eyebrow="Casais e fornecedores"
      title={mode === "curadoria" ? "Curadoria" : "Fornecedores"}
      description={descricaoDaTela(tela, mode, now)}
      actions={<AcoesDoCabecalho mode={mode} filterParams={tela.filterParams} />}
    />
  );
}

export function FiltrosDeFornecedores({ options, mode }: { options: TelaDeFornecedores["options"]; mode: ModoDaTela }) {
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
  const visiveis = mode === "curadoria" ? filters.filter((f) => f.key === "categoria" || f.key === "ordem") : filters;
  return <BarraDeFiltros searchPlaceholder="Buscar por nome, categoria ou cidade" filters={visiveis} />;
}
