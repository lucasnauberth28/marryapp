"use client";
// A página pública de fornecedores: busca e filtros, destaques, lista, convite para fornecedores e pedido de orçamento.
import Link from "next/link";
import { RodapeDaLanding } from "@/components/landing/landing-footer";
import { CabecalhoDaLanding } from "@/components/landing/landing-header";
import { estiloDoBotao, estiloDoContainerDaLanding } from "@/components/landing/styles";
import { cn } from "@/lib/utils";
import { AberturaComBusca } from "./abertura-com-busca";
import { BarraDeResultado } from "./barra-de-resultado";
import type { FornecedorPublico } from "./constantes";
import { Destaques } from "./destaques";
import { DialogoDeOrcamento } from "./dialogo-de-orcamento";
import { filtrarFornecedores, fornecedoresEmDestaque, ordenarFornecedores } from "./filtrar-fornecedores";
import { ListaDeFornecedores } from "./lista-de-fornecedores";
import { useFiltrosDosFornecedores } from "./use-filtros-dos-fornecedores";
import { usePedidoDeOrcamento } from "./use-pedido-de-orcamento";

interface PropriedadesDaVisaoDeFornecedoresPublicos {
  /** Já filtrados pelo servidor quando há data do casamento (sem quem está ocupado nela). */
  initialPartners: FornecedorPublico[];
  /** Filtro "Data do casamento" em vigor ("AAAA-MM-DD" ou ""). */
  weddingDate?: string;
  todayIso: string;
}

function ConviteParaFornecedores() {
  return (
    <section className="border-t border-linha bg-papel">
      <div className={cn(estiloDoContainerDaLanding, "flex flex-wrap items-center justify-between gap-6 py-12 sm:py-16")}>
        <div className="flex flex-1 basis-[420px] flex-col gap-2">
          <h2 className="font-display text-[28px] font-medium leading-9 text-tinta sm:text-[34px] sm:leading-10">Você é fornecedor?</h2>
          <p className="text-base leading-6 text-tinta-suave">Crie seu perfil grátis e receba pedidos de orçamento de casais da sua região. Todo perfil passa por uma curadoria antes de aparecer aqui.</p>
        </div>
        <Link href="/cadastro?tipo=fornecedor&plano=pro" className={estiloDoBotao.primary}>Cadastrar meu negócio</Link>
      </div>
    </section>
  );
}

export function VisaoDeFornecedoresPublicos({ initialPartners, weddingDate: dataAtiva = "", todayIso }: PropriedadesDaVisaoDeFornecedoresPublicos) {
  const filtros = useFiltrosDosFornecedores(dataAtiva, todayIso);
  const pedido = usePedidoDeOrcamento();
  const combinam = filtrarFornecedores(initialPartners, filtros);
  const exibidos = ordenarFornecedores(combinam, filtros.ordenacao);
  return (
    <div className="flex min-h-screen flex-col bg-linho font-sans text-tinta">
      <CabecalhoDaLanding />
      <AberturaComBusca filtros={filtros} hojeIso={todayIso} />
      <main className={cn(estiloDoContainerDaLanding, "flex flex-1 flex-col gap-8 pb-20 pt-10 sm:pb-24 sm:pt-12")}>
        <BarraDeResultado filtros={filtros} total={exibidos.length} dataAtiva={dataAtiva} />
        <Destaques fornecedores={fornecedoresEmDestaque(combinam)} />
        <ListaDeFornecedores fornecedores={exibidos} trocandoData={filtros.trocandoData} comData={!!dataAtiva} temFiltros={filtros.temFiltros} aoLimpar={filtros.limpar} aoPedirOrcamento={pedido.abrirPara} />
      </main>
      <ConviteParaFornecedores />
      <DialogoDeOrcamento pedido={pedido} />
      <RodapeDaLanding />
    </div>
  );
}
