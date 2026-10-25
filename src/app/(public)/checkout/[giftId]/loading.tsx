import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento, EsqueletoDeFormulario } from "@/components/skeletons";

// Espelha o checkout do presente: barra do topo, resumo do presente e o primeiro passo (identificação).
export default function CheckoutLoading() {
  return (
    <RegiaoDeCarregamento label="o pagamento do presente" className="flex min-h-dvh flex-col bg-linho font-sans text-tinta">
      <div className="border-b border-linha">
        <div className="mx-auto flex h-[60px] max-w-[560px] items-center gap-1 px-2 sm:px-4">
          <Esqueleto className="size-11 rounded-[12px]" />
          <Esqueleto className="h-5 w-24 rounded-md" />
          <Esqueleto className="ml-auto h-7 w-40 rounded-[6px]" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-4 pb-6 pt-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-[16px] border border-linha bg-papel p-3 shadow-[var(--shadow-aceito-1)]">
            <Esqueleto className="size-14 shrink-0 rounded-[12px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Esqueleto className="h-4 w-3/5 rounded-md" />
              <Esqueleto className="h-3.5 w-2/5 rounded-md" />
            </div>
            <Esqueleto className="h-7 w-20 rounded-lg" />
          </div>
          <div className="flex flex-col gap-5 pt-2">
            <div className="flex flex-col gap-2">
              <div className="flex h-4 items-center">
                <Esqueleto className="h-3 w-24 rounded-md" />
              </div>
              <div className="flex h-9 items-center">
                <Esqueleto className="h-7 w-3/4 rounded-lg" />
              </div>
              <div className="flex h-6 items-center">
                <Esqueleto className="h-4 w-2/3 rounded-md" />
              </div>
            </div>
            <EsqueletoDeFormulario fields={2} submit={false} className="gap-0" />
            <Esqueleto className="h-12 w-full rounded-[12px]" />
          </div>
        </div>
      </div>
    </RegiaoDeCarregamento>
  );
}
