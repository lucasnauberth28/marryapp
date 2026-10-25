import { Check, Copy, Eye } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { ETAPAS_DA_LINHA_DO_TEMPO, situacoesDasEtapas } from "@/lib/dominio/domain-order";
import { cn } from "@/lib/utils";
import { copiarTexto } from "./tipos-e-textos";

interface PropriedadesDoDocumento {
  mascarado: string;
  completo: string | null;
  podeRevelar: boolean;
  carregando: boolean;
  desabilitado: boolean;
  aoRevelar: () => void;
}

/** Documento: escondido; o completo só sai por ação auditada, enquanto o pedido está aberto. */
export function DocumentoDoTitular({ mascarado, completo, podeRevelar, carregando, desabilitado, aoRevelar }: PropriedadesDoDocumento) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm text-tinta-suave">Documento do titular</p>
      <p className="flex flex-wrap items-center gap-2">
        <span className="font-mono tabular-nums text-tinta">{completo ?? mascarado}</span>
        {podeRevelar && !completo ? (
          <Botao type="button" variant="outline" size="sm" loading={carregando} disabled={desabilitado} onClick={aoRevelar}>
            <Eye className="size-4" aria-hidden="true" /> Mostrar completo
          </Botao>
        ) : null}
        {completo ? (
          <button type="button" onClick={() => copiarTexto(completo.replace(/[^0-9A-Z]/g, ""), "Número copiado (só os dígitos).")} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm)}>
            <Copy className="size-4" aria-hidden="true" /> Copiar
          </button>
        ) : null}
      </p>
      {podeRevelar ? <p className="text-xs text-tinta-suave">Cada vez que o número completo é mostrado, fica no registro de atividades.</p> : null}
    </div>
  );
}

export function EtapasDoPedido({ status }: { status: Parameters<typeof situacoesDasEtapas>[0] }) {
  const states = situacoesDasEtapas(status);
  if (!states) return null;
  return (
    <ol className="flex flex-col gap-2" aria-label="Etapas do pedido">
      {ETAPAS_DA_LINHA_DO_TEMPO.map((step, i) => {
        const state = states[i];
        return (
          <li key={step.status} className="flex items-center gap-3 text-[15px]">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                state === "done" ? "bg-sucesso text-on-ameixa" : state === "todo" ? "border border-linha-forte text-tinta-suave" : "bg-ameixa text-on-ameixa",
              )}
              aria-hidden="true"
            >
              {state === "done" ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={state === "todo" ? "text-tinta-suave" : "font-semibold text-tinta"}>
              {step.title}
              <span className="sr-only">{state === "done" ? " (feito)" : state === "todo" ? " (depois)" : " (agora)"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
