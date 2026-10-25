import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ETAPAS_DA_LINHA_DO_TEMPO, SituacaoDaEtapa } from "@/lib/domain-order";

const ROTULO_DA_SITUACAO_DA_ETAPA: Record<SituacaoDaEtapa, string> = { done: "Concluído", current: "Em andamento", next: "A seguir", todo: "Depois" };

function PontoDaEtapa({ state }: { state: SituacaoDaEtapa }) {
  const base = "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2";
  if (state === "done") {
    return (
      <span className={cn(base, "border-ameixa bg-ameixa text-on-ameixa")}>
        <Check className="size-4" aria-hidden="true" />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className={cn(base, "border-ameixa bg-ameixa-suave text-ameixa")}>
        <Clock className="size-4" aria-hidden="true" />
      </span>
    );
  }
  return <span className={cn(base, "border-linha-forte bg-papel", state === "next" && "border-ameixa")} aria-hidden="true" />;
}

function textoDaData(status: string, date: string) {
  if (status === "REQUESTED") return `Pedido em ${date}`;
  return status === "REGISTERED" ? `Registrado em ${date}` : `No ar desde ${date}`;
}

interface PropriedadesDaEtapa {
  step: (typeof ETAPAS_DA_LINHA_DO_TEMPO)[number];
  state: SituacaoDaEtapa;
  date: string | null;
  ultima: boolean;
  /** A etapa seguinte também está concluída: o fio entre as duas fica colorido. */
  seguinteConcluida: boolean;
}

export function EtapaDaLinhaDoTempo({ step, state, date, ultima, seguinteConcluida }: PropriedadesDaEtapa) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0" aria-current={state === "current" ? "step" : undefined}>
      {!ultima ? (
        <span aria-hidden="true" className={cn("absolute top-8 bottom-0 left-4 w-0.5 -translate-x-1/2", state === "done" && seguinteConcluida ? "bg-ameixa" : "bg-linha-forte")} />
      ) : null}
      <PontoDaEtapa state={state} />
      <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
        <p className={cn("text-base font-semibold leading-6", state === "done" || state === "current" ? "text-tinta" : "text-tinta-suave")}>
          {step.title}
          <span className="ml-2 text-sm font-normal text-tinta-suave">{ROTULO_DA_SITUACAO_DA_ETAPA[state]}</span>
        </p>
        <p className="text-[15px] leading-6 text-tinta-suave">{state === "done" ? step.doneText : step.text}</p>
        {date && state === "done" ? <p className="text-sm text-tinta-suave">{textoDaData(step.status, date)}</p> : null}
      </div>
    </li>
  );
}
