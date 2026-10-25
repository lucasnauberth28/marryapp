import { ROTULO_DA_TAXA_DO_PRESENTE, type PlanoDaTaxaDoPresente } from "@/lib/pagamento/gift-fee";

/** Em que a taxa se aplica no plano, em uma frase. */
export function notaDaTaxa(plan: PlanoDaTaxaDoPresente): string {
  if (plan === "basic") return `${ROTULO_DA_TAXA_DO_PRESENTE} por presente no plano Básico`;
  return `Pix sem taxa no plano ${plan === "vip" ? "VIP" : "Classic"}; cartão ${ROTULO_DA_TAXA_DO_PRESENTE}`;
}

/** Linhas do extrato (a mesma conta para o extrato de verdade e para o exemplo). */
export function Extrato({ rows, label }: { rows: React.ReactNode; label: string }) {
  return (
    <dl aria-label={label} className="grid border-t border-linha">
      {rows}
    </dl>
  );
}

interface PropriedadesDaLinhaDoExtrato {
  term: React.ReactNode;
  note?: React.ReactNode;
  meta?: React.ReactNode;
  value: string;
  tone?: "saida" | "conferir";
  total?: boolean;
}

export function LinhaDoExtrato({ term, note, meta, value, tone, total = false }: PropriedadesDaLinhaDoExtrato) {
  return (
    <div className={`grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 border-b border-linha py-1.5 sm:grid-cols-[minmax(0,1fr)_auto_auto] ${total ? "-mt-px border-t border-dashed border-t-linha-forte" : ""}`}>
      <dt className={`text-sm ${total ? "font-semibold" : ""} ${tone === "conferir" ? "flex flex-wrap items-center gap-2" : ""}`}>
        {term}
        {note && <small className="block text-[12.5px] font-normal text-tinta-suave">{note}</small>}
      </dt>
      <span className="col-start-1 row-start-2 text-left text-[13px] tabular-nums text-tinta-suave sm:col-start-auto sm:row-start-auto sm:text-right">{meta}</span>
      <dd className={`col-start-2 row-start-1 min-w-[9ch] whitespace-nowrap text-right font-medium tabular-nums sm:col-start-auto sm:row-start-auto ${total ? "text-base font-semibold" : "text-[15px]"} ${tone === "saida" ? "text-tinta-suave" : tone === "conferir" ? "text-aviso" : ""}`}>{value}</dd>
    </div>
  );
}
