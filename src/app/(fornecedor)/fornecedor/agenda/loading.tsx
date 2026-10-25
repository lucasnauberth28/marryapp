import { Esqueleto } from "@/components/ui/skeleton";
import { RegiaoDeCarregamento, EsqueletoDeTexto } from "@/components/skeletons";

function CabecalhoEsqueleto() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex max-w-2xl flex-1 flex-col gap-1">
        <div className="hidden h-4 items-center md:flex">
          <Esqueleto className="h-3 w-24 rounded-md" />
        </div>
        <div className="flex h-9 items-center md:h-[46px]">
          <Esqueleto className="h-7 w-32 rounded-lg md:h-9" />
        </div>
        <EsqueletoDeTexto lines={2} lastLineWidth="w-2/3" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Esqueleto className="h-11 w-40 rounded-xl" />
        <Esqueleto className="h-11 w-40 rounded-xl" />
      </div>
    </div>
  );
}

function CalendarioEsqueleto() {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Esqueleto className="h-7 w-52 rounded-lg" />
        <div className="flex items-center gap-1">
          <Esqueleto className="size-11 rounded-xl" />
          <Esqueleto className="h-11 w-20 rounded-xl" />
          <Esqueleto className="size-11 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex h-4 items-center justify-center">
            <Esqueleto className="h-3 w-7 rounded-md" />
          </div>
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-14 rounded-[10px] border border-linha bg-papel p-1 sm:min-h-[104px] sm:p-2">
            <Esqueleto className="mx-auto h-4 w-5 rounded-md sm:mx-0" />
          </div>
        ))}
      </div>
      <div className="flex h-5 flex-wrap items-center gap-x-4 gap-y-2">
        <Esqueleto className="h-3 w-32 rounded-md" />
        <Esqueleto className="h-3 w-32 rounded-md" />
        <Esqueleto className="h-3 w-28 rounded-md" />
      </div>
    </div>
  );
}

function ProximosEsqueleto() {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex h-7 items-center">
        <Esqueleto className="h-5 w-48 rounded-md" />
      </div>
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="flex flex-col gap-1.5 rounded-2xl border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)]">
            <Esqueleto className="h-6 w-28 rounded-full" />
            <div className="flex h-7 items-center">
              <Esqueleto className="h-5 w-44 max-w-full rounded-md" />
            </div>
            <Esqueleto className="h-11 w-24 rounded-xl" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CorpoEsqueleto() {
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <CalendarioEsqueleto />
      <ProximosEsqueleto />
    </div>
  );
}

// Espelha a agenda: título e dois botões, o calendário do mês e os próximos compromissos.
export default function LoadingFornecedorAgenda() {
  return (
    <RegiaoDeCarregamento label="a agenda" className="flex flex-col gap-6">
      <CabecalhoEsqueleto />
      <CorpoEsqueleto />
    </RegiaoDeCarregamento>
  );
}
