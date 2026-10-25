"use client";

import { useState } from "react";
import { Painel } from "@/components/plataforma/panel";
import { AvisoDoFormulario } from "@/components/ui/field";
import { ToggleRow } from "../../_sistema/toggle-row";
import { useAdminAction } from "../../_sistema/use-admin-action";
import { salvarCapacidadesDaMadrinha } from "@/actions/admin-madrinha-actions";

type Caps = { draftReminder: boolean; suggestTasks: boolean; buildTimeline: boolean; compareQuotes: boolean };

const ITEMS: { key: keyof Caps; label: string; description: string }[] = [
  { key: "draftReminder", label: "Preparar rascunho de lembrete", description: "Para os convidados sem resposta" },
  { key: "suggestTasks", label: "Sugerir tarefas", description: "Com base no painel do casal" },
  { key: "buildTimeline", label: "Montar o cronograma do dia", description: "Sempre como rascunho" },
  { key: "compareQuotes", label: "Comparar orçamentos", description: "Item a item" },
];

/** O que ela pode fazer: cada interruptor salva na hora. "Enviar mensagens sozinha" nunca liga. */
export function CapabilitiesCard({ initial, badge }: { initial: Caps; badge: React.ReactNode }) {
  const [caps, setCaps] = useState(initial);
  const { pending, formError, run } = useAdminAction();

  function toggle(key: keyof Caps, value: boolean) {
    const next = { ...caps, [key]: value };
    setCaps(next);
    run(() => salvarCapacidadesDaMadrinha(next));
    // Se não salvou, o formError aparece e o interruptor volta ao que estava
  }

  return (
    <Painel title="O que ela pode fazer" aside={badge}>
      <div className="divide-y divide-linha">
        {ITEMS.map((item) => (
          <ToggleRow key={item.key} label={item.label} description={item.description} checked={caps[item.key]} onCheckedChange={(v) => toggle(item.key, v)} disabled={pending} />
        ))}
        <ToggleRow label="Enviar mensagens sozinha" description="Nunca. O casal sempre aprova antes." checked={false} locked />
      </div>
      {formError && (
        <div className="mt-3">
          <AvisoDoFormulario>{formError}</AvisoDoFormulario>
        </div>
      )}
    </Painel>
  );
}
