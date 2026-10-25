import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento } from "@/components/skeletons";

// Espelha os avisos: título, atalho de preferências, cartão de notificações e o histórico.
export default function LoadingFornecedorAvisos() {
  return (
    <RegiaoDeCarregamento label="os avisos" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 max-w-2xl flex-1">
          <div className="flex h-[38px] items-center md:h-[46px]">
            <Esqueleto className="h-8 w-28 rounded-lg md:h-9" />
          </div>
          <div className="mt-1.5 flex h-6 items-center">
            <Esqueleto className="h-4 w-full max-w-md rounded-md" />
          </div>
        </div>
        <Esqueleto className="h-11 w-64 rounded-xl" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]">
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-linha px-4">
          <Esqueleto className="h-4 w-20 rounded-md" />
          <Esqueleto className="h-4 w-40 rounded-md" />
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-linha px-4 py-2.5 last:border-b-0">
            <Esqueleto className="size-8 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Esqueleto className="h-4 w-44 max-w-full rounded-md" />
              <Esqueleto className="h-3.5 w-full max-w-md rounded-md" />
              <Esqueleto className="h-3.5 w-3/5 rounded-md sm:hidden" />
            </div>
            <Esqueleto className="h-3.5 w-14 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </RegiaoDeCarregamento>
  );
}
