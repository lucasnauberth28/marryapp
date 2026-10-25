import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento } from "@/components/skeletons";

// Espelha Minha conta: barra do topo (logo e voltar), título e os blocos (par, avisos, senha, dados e exclusão).
export default function ContaLoading() {
  return (
    <RegiaoDeCarregamento label="sua conta" className="min-h-dvh bg-linho text-tinta">
      <div className="border-b border-linha bg-linho/90">
        <div className="mx-auto flex h-16 w-full max-w-[880px] items-center justify-between gap-3 px-4 sm:px-6">
          <Esqueleto className="h-6 w-24 rounded-md" />
          <Esqueleto className="h-6 w-36 rounded-md" />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[880px] flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 md:pt-12">
        <div className="flex flex-col gap-1.5">
          <Esqueleto className="h-3 w-28 rounded-md" />
          <div className="flex h-[38px] items-center md:h-[46px]">
            <Esqueleto className="h-8 w-56 rounded-lg md:h-9" />
          </div>
          <Esqueleto className="h-4 w-64 rounded-md" />
        </div>

        <div className="flex flex-col gap-6">
          {[2, 3, 3, 1].map((fields, i) => (
            <section key={i} className="flex flex-col gap-5 rounded-[20px] border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-7">
              <div className="flex items-start gap-4">
                <Esqueleto className="size-11 shrink-0 rounded-[12px]" />
                <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
                  <Esqueleto className="h-6 w-40 rounded-md" />
                  <Esqueleto className="h-4 w-full max-w-md rounded-md" />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {Array.from({ length: fields }).map((_, j) => (
                  <Esqueleto key={j} className="h-12 w-full rounded-xl" />
                ))}
                <Esqueleto className="h-11 w-40 rounded-xl" />
              </div>
            </section>
          ))}
        </div>
      </div>
    </RegiaoDeCarregamento>
  );
}
