import { CabecalhoDaLanding } from "@/components/landing/landing-header";
import { RodapeDaLanding } from "@/components/landing/landing-footer";
import { estiloDoContainerDaLanding } from "@/components/landing/styles";
import { RegiaoDeCarregamento, EsqueletoDeImagem } from "@/components/skeletons";
import { Esqueleto } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Espelha a vitrine: a faixa sálvia com título, busca e categorias, o resultado e a grade de cartões.
// O cabeçalho e o rodapé são os de verdade (não dependem de dados), então nada pula quando a lista chega.
export default function FornecedoresLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-linho font-sans text-tinta">
      <CabecalhoDaLanding />
      <RegiaoDeCarregamento label="a vitrine de fornecedores" className="flex flex-1 flex-col">
        <section className="bg-salvia-suave">
          <div className={cn(estiloDoContainerDaLanding, "flex flex-col gap-6 py-10 sm:py-16")}>
            <div className="flex max-w-[720px] flex-col gap-3">
              <div className="flex h-4 items-center">
                <Esqueleto className="h-3 w-40 rounded-md bg-papel/70" />
              </div>
              <div className="flex flex-col">
                {["w-4/5", "w-3/5"].map((w) => (
                  <div key={w} className="flex h-10 items-center sm:h-[51px] lg:h-[63px]">
                    <Esqueleto className={`h-7 rounded-xl bg-papel/70 sm:h-9 lg:h-11 ${w}`} />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                {["w-full", "w-full", "w-2/3"].map((w, i) => (
                  <div key={i} className="flex h-[26px] items-center sm:h-7">
                    <Esqueleto className={`h-4 rounded-md bg-papel/70 ${w}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-3 gap-y-5 rounded-[16px] border border-linha bg-papel p-4 pt-5 shadow-aceito-1 sm:grid-cols-2 lg:grid-cols-4">
              <Esqueleto className="h-12 rounded-xl" />
              <Esqueleto className="h-12 rounded-xl" />
              <Esqueleto className="hidden h-12 rounded-xl sm:block" />
              <Esqueleto className="hidden h-12 rounded-xl sm:block" />
              <Esqueleto className="h-11 w-32 rounded-xl sm:hidden" />
            </div>
            <div className="-mx-4 flex gap-2 overflow-hidden px-4 pb-1 sm:mx-0 sm:px-0">
              {[88, 80, 104, 80, 92, 96, 108, 100].map((w, i) => (
                <Esqueleto key={i} className="h-11 shrink-0 rounded-[8px] bg-papel" style={{ width: w }} />
              ))}
            </div>
          </div>
        </section>

        <div className={cn(estiloDoContainerDaLanding, "flex flex-1 flex-col gap-8 pb-20 pt-10 sm:pb-24 sm:pt-12")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Esqueleto className="h-5 w-64 max-w-full rounded-md" />
            <div className="flex items-center gap-2">
              <Esqueleto className="h-11 w-36 rounded-[8px] sm:h-9" />
              <Esqueleto className="h-11 w-40 rounded-[12px] sm:h-9" />
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex flex-col gap-3">
                <EsqueletoDeImagem ratio="4/3" className="rounded-[16px]" />
                <div className="flex gap-2">
                  <Esqueleto className="h-7 w-24 rounded-[6px]" />
                  <Esqueleto className="h-7 w-32 rounded-[6px]" />
                </div>
                <div className="flex h-7 items-center">
                  <Esqueleto className="h-5 w-3/4 rounded-md" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex h-5 items-center">
                    <Esqueleto className="h-3.5 w-1/2 rounded-md" />
                  </div>
                  <div className="flex h-5 items-center">
                    <Esqueleto className="h-3.5 w-2/5 rounded-md" />
                  </div>
                </div>
                <div className="flex h-5 items-center">
                  <Esqueleto className="h-3.5 w-1/3 rounded-md" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Esqueleto className="h-11 rounded-[12px] sm:h-9" />
                  <Esqueleto className="h-11 rounded-[12px] sm:h-9" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </RegiaoDeCarregamento>
      <RodapeDaLanding />
    </div>
  );
}
