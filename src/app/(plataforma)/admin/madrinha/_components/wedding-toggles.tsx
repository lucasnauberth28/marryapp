"use client";

import { useState } from "react";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { AvisoDoFormulario } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { definirMadrinhaDoCasamentoAtiva } from "@/actions/admin-madrinha-actions";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";
import { BuscaDeCasamento } from "./wedding-search";

export interface ItemDeAlternanciaDoCasamento {
  id: string;
  coupleNames: string;
  enabled: boolean | null;
  blocked: boolean;
}

/** Ligar ou desligar a Liz por casal. Lista os casais com ajuste e o que a busca encontrar. */
export function AlternanciasDoCasamento({ initial }: { initial: ItemDeAlternanciaDoCasamento[] }) {
  const [items, setItems] = useState(initial);
  const { pending, formError, run } = useAcaoDoAdmin();

  function setEnabled(item: ItemDeAlternanciaDoCasamento, enabled: boolean | null) {
    run(() => definirMadrinhaDoCasamentoAtiva({ weddingId: item.id, enabled }), () =>
      setItems((list) => list.map((x) => (x.id === item.id ? { ...x, enabled } : x))),
    );
  }

  return (
    <Painel title="Ligar ou desligar por casal">
      <BuscaDeCasamento
        selectedId={null}
        label="Buscar casal"
        onPick={(hit) =>
          setItems((list) => (list.some((x) => x.id === hit.id) ? list : [{ id: hit.id, coupleNames: hit.coupleNames, enabled: hit.override?.enabled ?? null, blocked: hit.override?.blocked ?? false }, ...list]))
        }
      />
      {formError && (
        <div className="mt-3">
          <AvisoDoFormulario>{formError}</AvisoDoFormulario>
        </div>
      )}
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-tinta-suave">Nenhum casal com ajuste. Busque um casal e escolha para ele aparecer aqui.</p>
      ) : (
        <ul className="mt-4 divide-y divide-linha">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold leading-5 text-tinta" id={`w-${item.id}`}>
                  {item.coupleNames}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-tinta-suave">
                  {item.blocked && <EtiquetaDeSituacao tone="perigo">Bloqueada</EtiquetaDeSituacao>}
                  {item.enabled === null ? "Segue o padrão" : item.enabled ? "Ligada à mão" : "Desligada à mão"}
                  {item.enabled !== null && (
                    <button type="button" disabled={pending} onClick={() => setEnabled(item, null)} className="font-semibold text-ameixa underline underline-offset-2">
                      Voltar ao padrão
                    </button>
                  )}
                </p>
              </div>
              <Switch checked={item.enabled === true} disabled={pending} onCheckedChange={(v) => setEnabled(item, v)} aria-labelledby={`w-${item.id}`} />
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}
