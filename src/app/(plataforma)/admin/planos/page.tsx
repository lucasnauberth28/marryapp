import { Suspense } from "react";
import Link from "next/link";
import { Download, Pencil } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { RegiaoPendente } from "@/components/plataforma/pending";
import { umDosValores, type ParametrosDeBusca } from "@/lib/platform/list-params";
import { mesDoContador } from "@/lib/platform/payments";
import { contarNotasPendentes, listarPagamentosReembolsaveis, listarNotasPendentes, listarReembolsos } from "@/lib/platform/queries/receita/pendencias";
import { obterConfiguracaoDaPlataforma } from "@/lib/platform/settings";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { SecaoDoContador } from "./_components/contador-section";
import { AbasDePlanos } from "./_components/planos-tabs";
import { SecaoDeReembolsos } from "./_components/refunds-section";
import { EsqueletoDoContador, EsqueletoDosReembolsos, EsqueletoDoResumo } from "./_components/skeletons";
import { ResumoDosPlanos } from "./_resumo/resumo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planos e receita" };

const ABAS_DA_PAGINA = ["resumo", "reembolsos", "contador"] as const;
type AbaDosPlanos = (typeof ABAS_DA_PAGINA)[number];

const ESQUELETO_DA_ABA: Record<AbaDosPlanos, React.ReactNode> = {
  resumo: <EsqueletoDoResumo />,
  reembolsos: <EsqueletoDosReembolsos />,
  contador: <EsqueletoDoContador />,
};

export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const aba = umDosValores(query, "aba", ABAS_DA_PAGINA) ?? "resumo";
  const now = new Date();

  return (
    <>
      <CabecalhoDaPagina
        eyebrow="Dinheiro"
        title="Planos e receita"
        description="Casais pagam uma vez. Fornecedores pagam por mês."
        actions={
          <>
            <Link href="/admin/planos/catalogo" className={estiloDoBotao.secondary}>
              <Pencil className="size-4" aria-hidden="true" /> Catálogo e preços
            </Link>
            <Link href="/admin/planos?aba=contador" className={estiloDoBotao.secondary}>
              <Download className="size-4" aria-hidden="true" /> Exportar para o contador
            </Link>
          </>
        }
      />
      <AbasDePlanos active={aba} />
      {/* Cada aba busca os próprios dados: abas e cabeçalho ficam, só o corpo mostra o esqueleto (key = aba) */}
      <RegiaoPendente className="flex flex-col gap-6">
        <Suspense key={aba} fallback={ESQUELETO_DA_ABA[aba]}>
          {aba === "resumo" ? <ResumoDosPlanos now={now} /> : aba === "reembolsos" ? <ReembolsosDosPlanos now={now} /> : <ContadorDosPlanos now={now} month={mesDoContador(typeof query.mes === "string" ? query.mes : undefined, now)} />}
        </Suspense>
      </RegiaoPendente>
    </>
  );
}

async function ReembolsosDosPlanos({ now }: { now: Date }) {
  const [refunds, payments, policy] = await Promise.all([listarReembolsos(50), listarPagamentosReembolsaveis(), obterConfiguracaoDaPlataforma("refundPolicy")]);
  return <SecaoDeReembolsos refunds={refunds} payments={payments} now={now} policyText={policy.text} />;
}

async function ContadorDosPlanos({ now, month }: { now: Date; month: string }) {
  const [invoices, count] = await Promise.all([listarNotasPendentes(20), contarNotasPendentes()]);
  return <SecaoDoContador month={month} now={now} invoices={invoices} pendingCount={count} />;
}
