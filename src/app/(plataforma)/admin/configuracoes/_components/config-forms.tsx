"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SeletorDeData } from "@/components/ui/date-picker";
import { SeletorDeHora } from "@/components/ui/time-picker";
import { AvisoDoFormulario } from "@/components/ui/field";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
import { salvarRemetenteDeEmail, salvarManutencao, salvarPoliticaDeReembolso } from "@/actions/admin-config-actions";
import { LinhaDeAlternancia } from "../../_sistema/toggle-row";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";

export function FormularioDeManutencao({ initial }: { initial: { enabled: boolean; message: string; backDate: string; backTime: string } }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [message, setMessage] = useState(initial.message);
  const [backDate, setBackDate] = useState(initial.backDate);
  const [backTime, setBackTime] = useState(initial.backTime);
  const { pending, errors, formError, run } = useAcaoDoAdmin();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => salvarManutencao({ enabled, message, backDate, backTime }));
      }}
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-linha pb-1">
        <div className="min-w-0 flex-1">
          <LinhaDeAlternancia label="Modo de manutenção" description={enabled ? "Ligado: casais e convidados veem o aviso e o painel do casal fica só para leitura." : "Desligado agora."} checked={enabled} onCheckedChange={setEnabled} />
        </div>
        {initial.enabled && (
          <EtiquetaDeSituacao tone="aviso" icon={Wrench}>
            Ligado no momento
          </EtiquetaDeSituacao>
        )}
      </div>
      <Textarea label="Mensagem que as pessoas veem" value={message} onChange={(e) => setMessage(e.target.value)} error={errors.message} rows={2} maxLength={300} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SeletorDeData label="Volta em" optional value={backDate} onChange={(e) => setBackDate(e.target.value)} error={errors.backDate} />
        <SeletorDeHora label="Às" optional value={backTime} onChange={(e) => setBackTime(e.target.value)} error={errors.backTime} />
      </div>
      <p className="text-sm leading-5 text-tinta-suave">
        A mudança vale na hora para quem abrir ou salvar algo. Você, na administração, nunca é barrado, e os pagamentos (avisos do Mercado Pago) e as rotinas diárias seguem normais. O painel dos fornecedores não é afetado.
      </p>
      {formError && !Object.keys(errors).length && <AvisoDoFormulario>{formError}</AvisoDoFormulario>}
      <div>
        <Button type="submit" loading={pending}>
          Salvar
        </Button>
      </div>
    </form>
  );
}

export function FormularioDoRemetenteDeEmail({ initial }: { initial: { fromName: string; fromEmail: string; replyTo: string } }) {
  const [s, setS] = useState(initial);
  const { pending, errors, formError, run } = useAcaoDoAdmin();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => salvarRemetenteDeEmail(s));
      }}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input label="Nome de quem envia" value={s.fromName} onChange={(e) => setS({ ...s, fromName: e.target.value })} error={errors.fromName} maxLength={80} />
        <Input label="E-mail de envio" type="email" value={s.fromEmail} onChange={(e) => setS({ ...s, fromEmail: e.target.value })} error={errors.fromEmail} />
        <Input label="E-mail para respostas" type="email" value={s.replyTo} onChange={(e) => setS({ ...s, replyTo: e.target.value })} error={errors.replyTo} />
      </div>
      <p className="text-sm leading-5 text-tinta-suave">
        Se o e-mail de envio ficar vazio, usamos o remetente do servidor. O domínio do e-mail de envio precisa estar verificado na Resend: daqui não dá para conferir. Se a Resend recusar o endereço, o e-mail sai com o remetente do servidor.
      </p>
      {formError && !Object.keys(errors).length && <AvisoDoFormulario>{formError}</AvisoDoFormulario>}
      <div>
        <Button type="submit" loading={pending}>
          Salvar remetente
        </Button>
      </div>
    </form>
  );
}

export function FormularioDaPoliticaDeReembolso({ initial }: { initial: { days: number; text: string } }) {
  const [days, setDays] = useState(String(initial.days));
  const [text, setText] = useState(initial.text);
  const { pending, errors, formError, run } = useAcaoDoAdmin();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => salvarPoliticaDeReembolso({ days, text }));
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Prazo para pedir (dias)" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} error={errors.days} />
        <div className="flex min-h-11 items-center rounded-xl bg-areia px-4 text-[15px] text-tinta">
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">Quem decide</span>
            Eu decido cada pedido
          </span>
        </div>
      </div>
      <Textarea label="Texto para o casal" value={text} onChange={(e) => setText(e.target.value)} error={errors.text} rows={3} maxLength={1000} />
      {formError && !Object.keys(errors).length && <AvisoDoFormulario>{formError}</AvisoDoFormulario>}
      <div>
        <Button type="submit" loading={pending}>
          Salvar política
        </Button>
      </div>
    </form>
  );
}
