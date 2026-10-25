import { Logotipo } from "@/components/brand/logo";
import { RegiaoDeCarregamento, EsqueletoDeTexto } from "@/components/skeletons";
import { Esqueleto } from "@/components/ui/skeleton";

function Linhas({ count }: { count: number }) {
  return (
    <div className="grid gap-x-6 gap-y-2 sm:grid-cols-[180px_1fr]">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="contents">
          <div className="flex h-6 items-center">
            <Esqueleto className="h-4 w-24 rounded-md" />
          </div>
          <div className="flex h-6 items-center">
            <Esqueleto className={i % 2 ? "h-4 w-40 rounded-md" : "h-4 w-56 max-w-full rounded-md"} />
          </div>
        </div>
      ))}
    </div>
  );
}

// O recibo é conferido no servidor (dono da assinatura): o papel do recibo com os blocos Cliente, Pagamento e Valores.
export default function ReciboLoading() {
  return (
    <RegiaoDeCarregamento label="o recibo" className="min-h-dvh bg-linho px-4 py-6 text-tinta sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Esqueleto className="h-11 w-24 rounded-xl" />
          <Esqueleto className="h-11 w-32 rounded-xl" />
        </div>
        <div className="flex flex-col gap-7 rounded-2xl border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)] sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-linha pb-6">
            <div className="flex flex-col gap-2">
              <Logotipo height={28} />
              <Esqueleto className="h-4 w-44 rounded-md" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <Esqueleto className="h-9 w-28 rounded-lg" />
              <Esqueleto className="h-4 w-24 rounded-md" />
            </div>
          </div>
          <EsqueletoDeTexto lines={2} size="base" />
          {[4, 5].map((n, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Esqueleto className="h-3 w-20 rounded-md" />
              <Linhas count={n} />
            </div>
          ))}
          <div className="flex flex-col gap-3">
            <Esqueleto className="h-3 w-20 rounded-md" />
            <div className="flex justify-between gap-4">
              <Esqueleto className="h-4 w-28 rounded-md" />
              <Esqueleto className="h-4 w-20 rounded-md" />
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-linha pt-3">
              <Esqueleto className="h-4 w-24 rounded-md" />
              <Esqueleto className="h-8 w-28 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </RegiaoDeCarregamento>
  );
}
