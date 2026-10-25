import { useState, useTransition } from "react";
import { CalendarCheck, CalendarX } from "lucide-react";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";
import { conferirDisponibilidadeDoFornecedor } from "@/actions/vitrine/disponibilidade";

const dateLabel = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

function useConferenciaDeDisponibilidade(vendorId: string) {
  const [date, setDate] = useState("");
  const [result, setResult] = useState<{ date: string; available: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const consultar = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!date) return setError("Escolha a data do casamento.");
    startTransition(async () => {
      const res = await conferirDisponibilidadeDoFornecedor(vendorId, date);
      if (res.success) setResult({ date, available: res.available });
      else setError(res.error);
    });
  };

  const mudarData = (valor: string) => {
    setDate(valor);
    setResult(null);
    setError(null);
  };

  return { date, mudarData, result, error, isPending, consultar };
}

function ResultadoDaConsulta({ result }: { result: { date: string; available: boolean } }) {
  if (result.available) {
    return (
      <p className="flex items-start gap-2 rounded-[12px] bg-sucesso-suave px-3 py-2 text-sm font-semibold text-sucesso">
        <CalendarCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Data livre em {dateLabel(result.date)}. Peça seu orçamento.
      </p>
    );
  }
  return (
    <p className="flex items-start gap-2 rounded-[12px] bg-perigo-suave px-3 py-2 text-sm font-semibold text-perigo">
      <CalendarX className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      Data ocupada em {dateLabel(result.date)}.
    </p>
  );
}

/** "Ver disponibilidade": consulta só sim/não na agenda do fornecedor. */
export function ConferenciaDeDisponibilidade({ vendorId, todayIso }: { vendorId: string; todayIso: string }) {
  const { date, mudarData, result, error, isPending, consultar } = useConferenciaDeDisponibilidade(vendorId);
  return (
    <form onSubmit={consultar} className="flex flex-col gap-2" aria-describedby="disponibilidade-resultado">
      <div className="flex items-start gap-2">
        <Entrada id="disponibilidade-data" type="date" label="A data está livre?" min={todayIso} value={date} onChange={(e) => mudarData(e.target.value)} fieldClassName="flex-1" />
        <Botao type="submit" variant="outline" loading={isPending} className="h-12 rounded-[12px] px-4">
          Consultar
        </Botao>
      </div>
      <div id="disponibilidade-resultado" role="status" aria-live="polite">
        {result ? <ResultadoDaConsulta result={result} /> : null}
        {error ? <p className="text-sm font-semibold text-perigo">{error}</p> : null}
      </div>
    </form>
  );
}
