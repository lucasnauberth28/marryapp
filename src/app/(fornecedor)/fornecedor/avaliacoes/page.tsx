import type { Metadata } from "next";
import { Aparicao } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { obterContextoDaPaginaDoFornecedor } from "@/lib/security/vendor-guard";
import { carregarAvaliacoes, carregarResumoDasAvaliacoes, type FiltroDeAvaliacoes } from "./_avaliacoes/dados";
import { ListaDeAvaliacoes } from "./_avaliacoes/lista-de-avaliacoes";
import { ResumoDasAvaliacoes } from "./_avaliacoes/resumo-das-avaliacoes";
import { SemAvaliacoes } from "./_avaliacoes/sem-avaliacoes";

export const metadata: Metadata = { title: "Avaliações" };

function CabecalhoDasAvaliacoes() {
  return (
    <Aparicao variant="fade" className="flex flex-col gap-1">
      <p className={cn("hidden text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase md:block")}>Fornecedor</p>
      <h1 className="font-display text-[32px] leading-[38px] font-medium md:text-[40px] md:leading-[46px]">Avaliações</h1>
      <p className="text-tinta-suave">Suas respostas aparecem no seu perfil público, logo abaixo de cada avaliação.</p>
    </Aparicao>
  );
}

export default async function AvaliacoesPage({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { vendor } = await obterContextoDaPaginaDoFornecedor();
  if (!vendor) return null; // o layout explica que a conta ainda não foi vinculada

  const resumo = await carregarResumoDasAvaliacoes(vendor.id);
  const { filtro } = await searchParams;
  // Sem filtro na URL: abre nas que pedem resposta, se houver alguma.
  const filter: FiltroDeAvaliacoes = filtro === "todas" || filtro === "sem-resposta" ? filtro : resumo.unansweredCount > 0 ? "sem-resposta" : "todas";
  const reviews = resumo.total > 0 ? await carregarAvaliacoes(vendor.id, filter) : [];
  const perfilPublico = vendor.curationStatus === "APPROVED" ? `/fornecedores/${vendor.id}` : null;

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDasAvaliacoes />
      {resumo.total === 0 ? (
        <SemAvaliacoes perfilPublico={perfilPublico} />
      ) : (
        <>
          <ResumoDasAvaliacoes total={resumo.total} average={resumo.average} unansweredCount={resumo.unansweredCount} distribution={resumo.distribution} />
          <ListaDeAvaliacoes reviews={reviews} filter={filter} unansweredCount={resumo.unansweredCount} total={resumo.total} />
        </>
      )}
    </div>
  );
}
