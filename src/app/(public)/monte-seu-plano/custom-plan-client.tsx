"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { textoDoDescontoDoCombo } from "@/lib/pagamento/catalog";
import { calcularPrecoDoPlanoPersonalizado, pisosDosPlanosProntos, type ModuloDePreco } from "@/lib/pagamento/pricing-modules";
import { CabecalhoDaLanding } from "@/components/landing/landing-header";
import { RodapeDaLanding } from "@/components/landing/landing-footer";
import { estiloDoBotao, estiloDoContainerDaLanding, estiloDoSobretituloDaLanding } from "@/components/landing/styles";
import { cn } from "@/lib/utils";
import { BarraDoCelular } from "./componentes/barra-do-celular";
import { EscolhaDeRecursos } from "./componentes/escolha-de-recursos";
import { ResumoDoPlano, type PlanoPronto } from "./componentes/resumo";

interface Propriedades {
  modules: ModuloDePreco[];
  /** Classic e VIP no catálogo vigente: o plano adaptado nunca custa menos que eles quando leva os mesmos recursos. */
  planosProntos: PlanoPronto[];
}

export function PlanoPersonalizadoCliente({ modules, planosProntos }: Propriedades) {
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>(["site", "pixZero", "whatsapp"]);
  const alternar = (id: string) => setSelectedModuleIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  const calculation = useMemo(() => {
    const preco = (id: PlanoPronto["id"]) => planosProntos.find((p) => p.id === id)?.price ?? 0;
    return calcularPrecoDoPlanoPersonalizado(selectedModuleIds, modules, pisosDosPlanosProntos({ classic: preco("classic"), vip: preco("vip") }));
  }, [selectedModuleIds, modules, planosProntos]);
  const equivalente = planosProntos.find((p) => p.id === calculation.planoEquivalente) ?? null;
  const href = equivalente ? `/cadastro?plano=${equivalente.id}` : `/cadastro?tipo=casal&custom=true&modules=${selectedModuleIds.join(",")}&amount=${calculation.total}`;
  const quantidade = calculation.selectedModules.length;

  return (
    <div className="flex min-h-screen flex-col bg-linho font-sans text-tinta">
      <CabecalhoDaLanding />

      <main className={cn(estiloDoContainerDaLanding, "flex flex-1 flex-col gap-8 pb-32 pt-6 sm:pt-10 lg:pb-24")}>
        <div className="flex flex-col gap-3">
          <Link href="/#planos" className={cn(estiloDoBotao.quiet, "-ml-3 w-fit")}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Ver planos prontos
          </Link>
          <p className={estiloDoSobretituloDaLanding}>Plano sob medida</p>
          <h1 className="font-display text-[34px] font-medium leading-[40px] tracking-[-0.015em] sm:text-5xl sm:leading-[54px] lg:text-[56px] lg:leading-[62px]">Escolham só o que vão usar</h1>
          <p className="max-w-[60ch] text-[17px] leading-[26px] text-tinta-suave sm:text-lg sm:leading-7">{textoDoDescontoDoCombo()} O pagamento é único, sem mensalidade.</p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <EscolhaDeRecursos modules={modules} selecionados={selectedModuleIds} aoAlternar={alternar} />
          <ResumoDoPlano calculation={calculation} href={href} planoEquivalente={equivalente} />
        </div>
      </main>

      <BarraDoCelular total={calculation.total} quantidade={quantidade} href={href} rotulo={equivalente ? `Escolher o ${equivalente.name}` : "Continuar"} />
      <RodapeDaLanding />
    </div>
  );
}
