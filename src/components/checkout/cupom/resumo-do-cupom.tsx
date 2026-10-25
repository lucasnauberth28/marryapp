import { X } from "lucide-react";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import type { CupomAplicado } from "./tipos";

function LinhaDoResumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-tinta-suave">{rotulo}</dt>
      <dd className="tabular-nums">{valor}</dd>
    </div>
  );
}

/** O cupom já aplicado: valor do plano, crédito, desconto e o total no Pix. */
export function ResumoDoCupom({ applied, creditLabel, aoRemover }: { applied: CupomAplicado; creditLabel: string; aoRemover: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-sucesso/30 bg-sucesso-suave p-4" role="status">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] text-tinta">
          Cupom <strong className="font-mono font-semibold">{applied.code}</strong> aplicado.
        </p>
        <button type="button" onClick={aoRemover} className="-mr-2 -mt-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-ameixa hover:bg-ameixa-suave">
          <X aria-hidden="true" className="size-4" />
          Remover
        </button>
      </div>
      <dl className="flex flex-col gap-1 text-[15px]">
        <LinhaDoResumo rotulo="Valor do plano" valor={formatarReais(applied.price)} />
        {applied.credit > 0 ? <LinhaDoResumo rotulo={creditLabel} valor={`- ${formatarReais(applied.credit)}`} /> : null}
        <LinhaDoResumo rotulo={`Cupom ${applied.code}`} valor={`- ${formatarReais(applied.discount)}`} />
        <div className="flex justify-between gap-4 border-t border-sucesso/20 pt-1.5 font-semibold">
          <dt>Total no Pix</dt>
          <dd className="tabular-nums">{formatarReais(applied.total)}</dd>
        </div>
      </dl>
    </div>
  );
}
