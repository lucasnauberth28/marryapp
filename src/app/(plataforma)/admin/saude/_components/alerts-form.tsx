"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/ui/field";
import { Panel } from "@/components/plataforma/panel";
import { Button } from "@/components/ui/button";
import { salvarAlertasDeSaude, testarAlertasDeSaude } from "@/actions/admin-saude-actions";
import { ToggleRow } from "../../_sistema/toggle-row";
import { useAdminAction } from "../../_sistema/use-admin-action";

/** Alertas por e-mail: verificados uma vez por dia, na rotina diária. "Erros acima de 2%" não existe (sem Sentry). */
export function AlertsForm({ initial, emailConfigured }: { initial: { mercadoPagoFailures: boolean; whatsappDisconnected: boolean; routineMissed: boolean; sendTo: string }; emailConfigured: boolean }) {
  const [s, setS] = useState(initial);
  const save = useAdminAction();
  const test = useAdminAction();
  return (
    <Panel
      title="Alertas"
      description="Você recebe um e-mail quando uma destas coisas acontecer. A verificação é feita uma vez por dia, junto da rotina diária."
      aside={
        <Button type="button" variant="outline" size="sm" disabled={!initial.sendTo} loading={test.pending} onClick={() => test.run(() => testarAlertasDeSaude())} title={initial.sendTo ? undefined : "Salve primeiro o e-mail dos alertas"}>
          <Bell className="size-4" aria-hidden="true" /> Testar os alertas
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.run(() => salvarAlertasDeSaude(s));
        }}
      >
        <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
          <ToggleRow label="Mercado Pago falhou 3 vezes seguidas" description="Pode ter pagamento sem baixa" checked={s.mercadoPagoFailures} onCheckedChange={(v) => setS({ ...s, mercadoPagoFailures: v })} className="border-b border-linha" />
          <ToggleRow label="WhatsApp desconectou" description="Convites e lembretes param de sair" checked={s.whatsappDisconnected} onCheckedChange={(v) => setS({ ...s, whatsappDisconnected: v })} className="border-b border-linha" />
          <ToggleRow label="Uma rotina diária não rodou" description="Vencimentos e avisos podem atrasar" checked={s.routineMissed} onCheckedChange={(v) => setS({ ...s, routineMissed: v })} className="border-b border-linha" />
        </div>
        <div className="max-w-md">
          <Input label="Enviar alertas para" type="email" value={s.sendTo} onChange={(e) => setS({ ...s, sendTo: e.target.value })} error={save.errors.sendTo} hint="Sem e-mail aqui, nenhum alerta é enviado." />
        </div>
        {!emailConfigured && <p className="text-sm font-semibold text-aviso">O e-mail não está configurado no servidor: nenhum alerta sai até configurar o envio.</p>}
        {(save.formError && !Object.keys(save.errors).length && <FormAlert>{save.formError}</FormAlert>) || (test.formError && <FormAlert>{test.formError}</FormAlert>)}
        <div>
          <Button type="submit" loading={save.pending}>
            Salvar alertas
          </Button>
        </div>
      </form>
    </Panel>
  );
}
