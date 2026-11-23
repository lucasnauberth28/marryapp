"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { AvisoDoFormulario } from "@/components/ui/field";
import { Interruptor } from "@/components/ui/switch";
import { estiloDoBotao } from "@/components/landing/styles";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";
import { definirSeALizEstaLigada, pausarOuRetomarALiz } from "@/actions/madrinha/interruptor";

interface Props {
  ligada: boolean;
  pausada: boolean;
  /** A chave do Gemini está no servidor? Sem ela não dá para ligar. */
  temChave: boolean;
}

/** Liga e desliga a Liz para os casais; o botão de pausa fica no topo da página. */
export function InterruptorGeralDaLiz({ ligada, pausada, temChave }: Props) {
  const [ligadaAgora, setLigada] = useState(ligada);
  const { pending, formError, run } = useAcaoDoAdmin();
  return (
    <div className="flex flex-col gap-2 border-b border-linha pb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p id="master-t" className="text-[15px] font-semibold leading-5 text-tinta">Liz ligada para os casais</p>
          <p id="master-d" className="mt-0.5 text-sm leading-5 text-tinta-suave">
            {temChave ? (pausada ? "Pausada: os casais usam só o guia de ajuda." : "Ligada: as perguntas vão ao Gemini, dentro dos limites abaixo.") : "Falta a chave do Gemini (GEMINI_API_KEY) no servidor."}
          </p>
        </div>
        <Interruptor
          checked={ligadaAgora}
          disabled={pending || (!temChave && !ligadaAgora)}
          aria-labelledby="master-t"
          aria-describedby="master-d"
          className="mt-0.5"
          onCheckedChange={(valor) => {
            setLigada(valor);
            run(() => definirSeALizEstaLigada({ ligada: valor }), undefined);
          }}
        />
      </div>
      {formError ? <AvisoDoFormulario>{formError}</AvisoDoFormulario> : null}
    </div>
  );
}

export function BotaoDePausarALiz({ pausada, ligada }: { pausada: boolean; ligada: boolean }) {
  const { pending, formError, run } = useAcaoDoAdmin();
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending || (!ligada && !pausada)}
        onClick={() => run(() => pausarOuRetomarALiz({ pausar: !pausada }))}
        className={`${estiloDoBotao.secondary} ${pausada ? "" : "text-perigo"}`}
        title={ligada || pausada ? undefined : "Só dá para pausar com a Liz ligada"}
      >
        {pausada ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
        {pausada ? "Retomar a Liz" : "Pausar a Liz para todos"}
      </button>
      {formError ? <AvisoDoFormulario>{formError}</AvisoDoFormulario> : null}
    </div>
  );
}
