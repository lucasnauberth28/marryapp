import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento, EsqueletoDoCabecalhoDaPagina } from "@/components/skeletons";
import { EsqueletoDoPainel } from "@/components/painel/skeleton-parts";

// Espelha o cronograma: cabeçalho com dois botões e a lista de horários (hora, título e ações).
export default function CronogramaLoading() {
  return (
    <RegiaoDeCarregamento label="o cronograma" className="flex flex-col gap-6">
      <EsqueletoDoCabecalhoDaPagina actions={2} />
      <ol className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i}>
            <EsqueletoDoPainel className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5 sm:py-4">
              <Esqueleto className="h-6 w-14 rounded-md" />
              <div className="flex min-w-0 flex-col gap-1.5">
                <Esqueleto className={i % 2 ? "h-4 w-40 max-w-full rounded-md" : "h-4 w-56 max-w-full rounded-md"} />
                <Esqueleto className="h-3.5 w-3/5 rounded-md" />
              </div>
              <div className="flex items-center">
                <Esqueleto className="size-11 rounded-xl bg-transparent" />
                <Esqueleto className="size-11 rounded-xl bg-transparent" />
              </div>
            </EsqueletoDoPainel>
          </li>
        ))}
      </ol>
    </RegiaoDeCarregamento>
  );
}
