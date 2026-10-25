import { Suspense } from "react";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { type ParametrosDeBusca, umDosValores } from "@/lib/platform/list-params";
import { formatarDataPorExtenso } from "@/lib/platform/format";
import { PERIODOS, type Periodo } from "@/lib/platform/overview-period";
import { saudacaoParaAHora } from "@/lib/wedding-format";
import prisma from "@/lib/prisma";
import { BlocoDeAtencao } from "./_visao-geral/blocos/atencao";
import { BlocoDeErros } from "./_visao-geral/blocos/erros";
import { BlocoDoFunil } from "./_visao-geral/blocos/funil";
import { BlocoDeNumeros } from "./_visao-geral/blocos/numeros";
import { BlocoDeProximos } from "./_visao-geral/blocos/proximos";
import { BlocoDeReceita } from "./_visao-geral/blocos/receita";
import { VisaoGeralVazia } from "./_visao-geral/blocos/vazia";
import { BlocoDeVencimentos } from "./_visao-geral/blocos/vencimentos";
import { SeletorDePeriodo } from "./_visao-geral/period-select";
import { EsqueletoDoBlocoDeAtencao, EsqueletoDoBlocoDeErros, EsqueletoDoBlocoDeVencimentos, EsqueletoDoBlocoDoFunil, EsqueletoDosNumeros, EsqueletoDaVisaoGeral, EsqueletoDoBlocoDeReceita, EsqueletoDoBlocoDeProximos } from "./_visao-geral/skeletons";

export const metadata = { title: "Visão geral" };

/**
 * Visão geral. A página só espera o guard e a URL; o resto chega por streaming: o cabeçalho sai logo e cada bloco
 * (números, atenção, receita, funil, casamentos próximos, planos vencendo, erros) carrega no seu Suspense,
 * independente dos outros, com esqueleto do tamanho real.
 */
export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  const admin = await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" }).format(now)) % 24;
  const greeting = admin.firstName ? `${saudacaoParaAHora(hour)}, ${admin.firstName}` : saudacaoParaAHora(hour);
  const eyebrow = formatarDataPorExtenso(now).toLocaleUpperCase("pt-BR");
  const period = umDosValores(query, "periodo", PERIODOS) ?? "30d";

  return (
    <Suspense fallback={<EsqueletoDaVisaoGeral />}>
      <ConteudoDaVisaoGeral eyebrow={eyebrow} title={greeting} period={period} now={now} />
    </Suspense>
  );
}

async function ConteudoDaVisaoGeral({ eyebrow, title, period, now }: { eyebrow: string; title: string; period: Periodo; now: Date }) {
  const weddingCount = await prisma.wedding.count();
  if (weddingCount === 0) return <VisaoGeralVazia eyebrow={eyebrow} title={title} />;

  return (
    <>
      <CabecalhoDaPagina eyebrow={eyebrow} title={title} description="O que pede a sua decisão hoje e como a plataforma está indo." actions={<SeletorDePeriodo value={period} />} />

      <Suspense fallback={<EsqueletoDosNumeros />}>
        <BlocoDeNumeros period={period} now={now} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Suspense fallback={<EsqueletoDoBlocoDeAtencao />}>
          <BlocoDeAtencao now={now} />
        </Suspense>
        <Suspense fallback={<EsqueletoDoBlocoDeReceita />}>
          <BlocoDeReceita now={now} />
        </Suspense>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <Suspense fallback={<EsqueletoDoBlocoDoFunil />}>
          <BlocoDoFunil period={period} now={now} />
        </Suspense>
        <Suspense fallback={<EsqueletoDoBlocoDeProximos />}>
          <BlocoDeProximos period={period} now={now} />
        </Suspense>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Suspense fallback={<EsqueletoDoBlocoDeVencimentos />}>
          <BlocoDeVencimentos now={now} />
        </Suspense>
        <Suspense fallback={<EsqueletoDoBlocoDeErros />}>
          <BlocoDeErros now={now} />
        </Suspense>
      </div>
    </>
  );
}
