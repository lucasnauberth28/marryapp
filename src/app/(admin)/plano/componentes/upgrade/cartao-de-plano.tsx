import { Check } from "lucide-react";
import { formatarPrecoDoPlano, type OpcaoDePlano } from "@/app/login/auth-config";
import { cn } from "@/lib/utils";

interface PropriedadesDoCartaoDePlano {
  plano: OpcaoDePlano;
  marcado: boolean;
  aoEscolher: (id: string) => void;
}

/** Um plano para escolher (botão de rádio escondido, o cartão inteiro é o rótulo). */
export function CartaoDePlano({ plano: p, marcado, aoEscolher }: PropriedadesDoCartaoDePlano) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col gap-4 rounded-2xl bg-papel p-5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-ameixa has-[:disabled]:cursor-default sm:p-[22px]",
        marcado ? "border-2 border-ameixa" : "border border-linha p-[21px] hover:border-linha-forte sm:p-[23px]",
      )}
    >
      <input type="radio" name="plano" value={p.id} checked={marcado} onChange={() => aoEscolher(p.id)} className="sr-only" />
      <span className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2 text-lg font-semibold text-tinta">
            {p.name}
            {p.popular ? <span className="rounded-full bg-ameixa-suave px-2.5 py-0.5 text-[13px] font-semibold text-ameixa">Mais escolhido</span> : null}
          </span>
          <span className="text-[15px] text-tinta-suave">{p.summary}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-num text-[30px] leading-[34px] text-tinta">{formatarPrecoDoPlano(p.price)}</span>
          <span className="text-sm text-tinta-suave">{p.period}</span>
        </span>
      </span>
      <ul className="flex flex-col gap-2 border-t border-linha pt-4">
        {p.features.map((f) => (
          <li key={f} className="flex gap-2.5 text-[15px] leading-[22px] text-tinta">
            <Check className="mt-[3px] h-4 w-4 shrink-0 text-sucesso" strokeWidth={2.25} aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>
    </label>
  );
}
