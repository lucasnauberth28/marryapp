import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento, EsqueletoDeImagem } from "@/components/skeletons";

// Espelha a lista de presentes do casal: título, busca e a grade de fotos (proporção fixa, sem pulo de layout).
export default function PresentesPublicLoading() {
  return (
    <RegiaoDeCarregamento label="a lista de presentes" className="min-h-dvh bg-linho">
      <div className="border-b border-linha px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between">
          <Esqueleto className="h-7 w-16 rounded-md" />
          <Esqueleto className="h-9 w-40 rounded-[12px]" />
        </div>
      </div>
      <div className="mx-auto max-w-[1120px] space-y-8 px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-xl space-y-3">
          <Esqueleto className="h-4 w-36 rounded-md" />
          <Esqueleto className="h-12 w-3/4 rounded-xl" />
          <Esqueleto className="h-5 w-full rounded-md" />
        </div>
        <Esqueleto className="h-11 w-full rounded-xl sm:w-[360px]" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <EsqueletoDeImagem ratio={1} className="rounded-[16px]" />
              <Esqueleto className="h-5 w-3/4 rounded-md" />
              <Esqueleto className="h-4 w-1/3 rounded-md" />
              <Esqueleto className="h-11 w-full rounded-[12px] sm:h-9" />
            </div>
          ))}
        </div>
      </div>
    </RegiaoDeCarregamento>
  );
}
