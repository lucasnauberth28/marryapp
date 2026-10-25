import { Check } from "lucide-react";
import { formatarPrecoDoPlano, type OpcaoDePlano } from "@/app/login/auth-config";
import { cn } from "@/lib/utils";

export const NIVEL_DO_PLANO: Record<string, string> = { pro: "PRO", master: "MASTER" };

interface PropriedadesDaOpcao {
  opcao: OpcaoDePlano;
  ativa: boolean;
  doFornecedor: boolean;
  aoEscolher: (id: string) => void;
}

function OpcaoDePlanoPago({ opcao: o, ativa, doFornecedor, aoEscolher }: PropriedadesDaOpcao) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativa}
      onClick={() => aoEscolher(o.id)}
      className={cn(
        "flex cursor-pointer flex-col gap-4 rounded-2xl bg-papel p-5 text-left transition-[border-color,box-shadow] duration-300",
        ativa ? "border-2 border-ameixa p-[19px] shadow-[var(--shadow-aceito-1)]" : "border border-linha hover:border-linha-forte",
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span>
          <span className="flex items-center gap-2 text-lg font-semibold">
            {o.name}
            {doFornecedor ? <span className="rounded-md bg-salvia-suave px-2 py-0.5 text-xs font-semibold text-salvia">Seu plano</span> : null}
          </span>
          <span className="block text-[15px] text-tinta-suave">{o.summary}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-num text-[28px] leading-8">{formatarPrecoDoPlano(o.price)}</span>
          <span className="block text-sm text-tinta-suave">{o.period}</span>
        </span>
      </span>
      <span className="flex flex-col gap-2 border-t border-linha pt-4">
        {o.features.map((f) => (
          <span key={f} className="flex items-start gap-2.5 text-[15px] leading-[22px]">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sucesso" strokeWidth={2.25} />
            {f}
          </span>
        ))}
      </span>
    </button>
  );
}

interface PropriedadesDasOpcoes {
  options: OpcaoDePlano[];
  escolhido: string;
  currentTier: string;
  aoEscolher: (id: string) => void;
}

export function OpcoesDePlano({ options, escolhido, currentTier, aoEscolher }: PropriedadesDasOpcoes) {
  return (
    <div role="radiogroup" aria-labelledby="planos-titulo" className="grid gap-4 md:grid-cols-2">
      {options.map((o) => (
        <OpcaoDePlanoPago key={o.id} opcao={o} ativa={o.id === escolhido} doFornecedor={NIVEL_DO_PLANO[o.id] === currentTier} aoEscolher={aoEscolher} />
      ))}
    </div>
  );
}
