import { Suspense } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { RegiaoPendente } from "@/components/plataforma/pending";
import { NavegacaoDeAbas } from "@/components/plataforma/tabs-nav";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { umDosValores, type ParametrosDeBusca } from "@/lib/platform/list-params";
import { diasEntre } from "@/lib/platform/format";
import { obterCabecalhoDoCasal } from "@/lib/platform/queries/casais/cabecalho";
import { AbaPagamentos } from "./_abas/aba-pagamentos";
import { AbaSuporte } from "./_abas/aba-suporte";
import { AbaVisaoGeral } from "./_abas/aba-visao-geral";
import { CabecalhoDoCasalNaTela } from "./_abas/cabecalho-do-casal";
import { ColunaLateral } from "./_abas/paineis-laterais";
import { AbaAtividade, AbaConvidados, AbaDominio, AbaMadrinha } from "./_abas/outras-abas";
import { EsqueletoDaAbaDoCasal } from "./_components/skeletons";

export const metadata = { title: "Casal" };

const ABAS = ["visao", "pagamentos", "convidados", "atividade", "dominio", "madrinha", "suporte"] as const;
type AbaDoCasal = (typeof ABAS)[number];

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const { id } = await params;
  // O id vem da URL: só serve para BUSCAR o casamento (nunca para decidir permissão). Formato inválido = 404.
  if (!z.string().uuid().safeParse(id).success) notFound();
  const tab: AbaDoCasal = umDosValores(await searchParams, "aba", ABAS) ?? "visao";

  const now = new Date();
  const header = await obterCabecalhoDoCasal(id, now);
  if (!header) notFound();
  const { wedding, pix } = header;
  const base = `/admin/casais/${id}`;
  const sideColumn = <ColunaLateral header={header} tab={tab} />;

  return (
    <>
      <CabecalhoDoCasalNaTela header={header} base={base} daysLeft={wedding.weddingDate ? diasEntre(wedding.weddingDate, now) : null} />
      <NavegacaoDeAbas
        label="Abas do casal"
        basePath={base}
        active={tab}
        tabs={[
          { value: "visao", label: "Visão geral" },
          { value: "pagamentos", label: "Pagamentos e plano", count: pix ? 1 : undefined },
          { value: "convidados", label: "Convidados e presentes" },
          { value: "atividade", label: "Atividade e notificações" },
          { value: "dominio", label: "Domínio" },
          { value: "madrinha", label: "Liz" },
          { value: "suporte", label: "Suporte" },
        ]}
      />
      {/* Cada aba busca os próprios dados: o cabeçalho e os números ficam na tela e só o corpo mostra o esqueleto (key = aba) */}
      <RegiaoPendente>
        <Suspense key={tab} fallback={<EsqueletoDaAbaDoCasal tab={tab} />}>
          {tab === "visao" && <AbaVisaoGeral header={header} sideColumn={sideColumn} />}
          {tab === "pagamentos" && <AbaPagamentos header={header} sideColumn={sideColumn} />}
          {tab === "convidados" && <AbaConvidados id={id} />}
          {tab === "atividade" && <AbaAtividade id={id} />}
          {tab === "dominio" && <AbaDominio id={id} />}
          {tab === "madrinha" && <AbaMadrinha id={id} />}
          {tab === "suporte" && <AbaSuporte id={id} />}
        </Suspense>
      </RegiaoPendente>
    </>
  );
}
