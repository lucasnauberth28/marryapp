import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { PREDEFINICOES_DE_HORA } from "./use-seletor-de-hora";

const BOTAO_DE_PASSO = "w-12 h-8 flex items-center justify-center rounded-lg hover:bg-areia text-tinta-suave transition cursor-pointer";

interface PropriedadesDaColuna {
  valor: number;
  rotuloDeCima: string;
  rotuloDeBaixo: string;
  aoSubir: (e: React.MouseEvent) => void;
  aoDescer: (e: React.MouseEvent) => void;
}

function ColunaDoSeletor({ valor, rotuloDeCima, rotuloDeBaixo, aoSubir, aoDescer }: PropriedadesDaColuna) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button type="button" onMouseDown={(e) => e.stopPropagation()} onClick={aoSubir} aria-label={rotuloDeCima} className={BOTAO_DE_PASSO}>
        <ChevronUp className="w-4 h-4" />
      </button>
      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-brand-100 border border-line">
        <span className="text-xl font-bold font-mono text-brand tracking-wider">{valor >= 0 ? String(valor).padStart(2, "0") : "--"}</span>
      </div>
      <button type="button" onMouseDown={(e) => e.stopPropagation()} onClick={aoDescer} aria-label={rotuloDeBaixo} className={BOTAO_DE_PASSO}>
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}

interface Propriedades {
  hours: number;
  minutes: number;
  displayValue: string;
  mover: (parte: "hora" | "minuto", sentido: 1 | -1) => (e: React.MouseEvent) => void;
  aoEscolherPredefinicao: (h: number, m: number) => void;
}

export function PainelDoSeletorDeHora({ hours, minutes, displayValue, mover, aoEscolherPredefinicao }: Propriedades) {
  return (
    <>
      <div className="flex items-center gap-3">
        <ColunaDoSeletor valor={hours} rotuloDeCima="Aumentar a hora" rotuloDeBaixo="Diminuir a hora" aoSubir={mover("hora", 1)} aoDescer={mover("hora", -1)} />
        <span className="text-2xl font-bold text-brand select-none pb-0.5">:</span>
        <ColunaDoSeletor valor={minutes} rotuloDeCima="Aumentar os minutos" rotuloDeBaixo="Diminuir os minutos" aoSubir={mover("minuto", 1)} aoDescer={mover("minuto", -1)} />
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-linha">
        {PREDEFINICOES_DE_HORA.map((preset) => (
          <button
            key={preset}
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const [h, m] = preset.split(":").map(Number);
              aoEscolherPredefinicao(h, m);
            }}
            className={cn("min-h-9 px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer", displayValue === preset ? "bg-brand text-white" : "bg-areia text-tinta-suave hover:bg-linha")}
          >
            {preset}
          </button>
        ))}
      </div>
    </>
  );
}
