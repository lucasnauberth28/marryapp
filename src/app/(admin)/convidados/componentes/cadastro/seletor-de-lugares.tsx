import { Minus, Plus } from "lucide-react";
import { estiloDoBotao, estiloDaDicaDoPainel, estiloDoRotuloDoPainel } from "@/components/painel/styles";

const MAXIMO_DE_LUGARES = 20;

interface PropriedadesDoSeletorDeLugares {
  id: string;
  lugares: number;
  aoMudar: (atualizar: (n: number) => number) => void;
}

export function SeletorDeLugares({ id, lugares, aoMudar }: PropriedadesDoSeletorDeLugares) {
  return (
    <div className="flex flex-col gap-2">
      <span className={estiloDoRotuloDoPainel} id={id}>
        Lugares reservados
      </span>
      <div role="group" aria-labelledby={id} className="flex items-center gap-3">
        <button type="button" aria-label="Menos um lugar" disabled={lugares <= 1} onClick={() => aoMudar((n) => Math.max(1, n - 1))} className={`${estiloDoBotao.secondary} w-12 !px-0`}>
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <output aria-live="polite" className="min-w-12 text-center font-num text-[28px] leading-8 text-tinta [font-variant-numeric:lining-nums]">
          {lugares}
        </output>
        <button type="button" aria-label="Mais um lugar" disabled={lugares >= MAXIMO_DE_LUGARES} onClick={() => aoMudar((n) => Math.min(MAXIMO_DE_LUGARES, n + 1))} className={`${estiloDoBotao.secondary} w-12 !px-0`}>
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
      <p className={estiloDaDicaDoPainel}>Conta a própria pessoa e quem ela pode levar.</p>
    </div>
  );
}
