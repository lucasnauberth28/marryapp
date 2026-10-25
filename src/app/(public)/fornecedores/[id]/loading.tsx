import { CabecalhoDaLanding } from "@/components/landing/landing-header";
import { RodapeDaLanding } from "@/components/landing/landing-footer";
import { estiloDoContainerDaLanding } from "@/components/landing/styles";
import { RegiaoDeCarregamento, EsqueletoDeImagem, EsqueletoDeTexto } from "@/components/skeletons";
import { Esqueleto } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function TopoEsqueleto() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Esqueleto className="h-11 w-36 rounded-[12px]" />
      <Esqueleto className="h-11 w-40 rounded-[12px] sm:h-9" />
    </div>
  );
}

function GaleriaDoComputadorEsqueleto() {
  return (
    <div className="hidden md:grid md:auto-rows-[200px] md:grid-cols-4 md:gap-2 md:overflow-hidden md:rounded-[16px]">
      <Esqueleto className="col-span-2 row-span-2 rounded-none" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Esqueleto key={i} className="rounded-none" />
      ))}
    </div>
  );
}

function GaleriaDoCelularEsqueleto() {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      <EsqueletoDeImagem ratio="4/3" className="rounded-[16px]" />
      <div className="-mx-4 flex gap-2 overflow-hidden px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Esqueleto key={i} className="size-[60px] shrink-0 rounded-[12px]" />
        ))}
      </div>
    </div>
  );
}

function ColunaPrincipalEsqueleto() {
  return (
    <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-10">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Esqueleto className="h-7 w-24 rounded-[6px]" />
          <Esqueleto className="h-7 w-44 rounded-[6px]" />
        </div>
        <div className="flex items-center gap-4">
          <Esqueleto className="size-14 shrink-0 rounded-full sm:size-16" />
          <Esqueleto className="h-9 w-3/4 max-w-md rounded-xl sm:h-11" />
        </div>
        <div className="flex h-6 items-center gap-4">
          <Esqueleto className="h-4 w-44 rounded-md" />
          <Esqueleto className="h-4 w-32 rounded-md" />
        </div>
      </div>
      <section className="flex flex-col gap-3">
        <div className="flex h-8 items-center">
          <Esqueleto className="h-6 w-20 rounded-md" />
        </div>
        <EsqueletoDeTexto lines={4} className="max-w-[68ch]" />
      </section>
      <section className="flex flex-col gap-4">
        <div className="flex h-8 items-center">
          <Esqueleto className="h-6 w-32 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Esqueleto className="h-8 w-32 rounded-[8px]" />
          <Esqueleto className="h-8 w-28 rounded-[8px]" />
          <Esqueleto className="h-8 w-36 rounded-[8px]" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Esqueleto className="h-[74px] rounded-[16px]" />
          <Esqueleto className="h-[74px] rounded-[16px]" />
        </div>
      </section>
    </div>
  );
}

function LateralEsqueleto() {
  return (
    <aside className="min-w-0 max-w-[400px] flex-[1_1_320px] max-lg:max-w-none">
      <div className="flex flex-col gap-5 rounded-[16px] border border-linha bg-papel p-6 shadow-aceito-2">
        <div className="flex flex-col gap-1">
          <Esqueleto className="h-4 w-20 rounded-md" />
          <Esqueleto className="h-9 w-36 rounded-lg" />
        </div>
        <div className="flex items-start gap-2">
          <Esqueleto className="h-12 flex-1 rounded-xl" />
          <Esqueleto className="h-12 w-24 rounded-[12px]" />
        </div>
        <div className="flex flex-col gap-5 border-t border-linha pt-5">
          <Esqueleto className="h-7 w-40 rounded-md" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Esqueleto key={i} className="h-12 rounded-xl" />
          ))}
          <Esqueleto className="h-11 rounded-[12px]" />
        </div>
      </div>
    </aside>
  );
}

function CorpoEsqueleto() {
  return (
    <div className="flex flex-wrap items-start gap-x-12 gap-y-10 pt-4">
      <ColunaPrincipalEsqueleto />

      <LateralEsqueleto />
    </div>
  );
}

// Espelha o perfil do fornecedor: voltar e compartilhar, fotos (mosaico no computador, foto grande no celular),
// título e seções à esquerda e o cartão de orçamento à direita. Cabeçalho e rodapé são os de verdade.
export default function VendorDetailLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-linho font-sans text-tinta">
      <CabecalhoDaLanding />
      <RegiaoDeCarregamento label="o perfil do fornecedor" className={cn(estiloDoContainerDaLanding, "flex flex-1 flex-col gap-6 pb-0 pt-4 sm:pt-6 lg:pb-24")}>
        <TopoEsqueleto />
        <GaleriaDoComputadorEsqueleto />
        <GaleriaDoCelularEsqueleto />
        <CorpoEsqueleto />
      </RegiaoDeCarregamento>
      <RodapeDaLanding />
    </div>
  );
}
