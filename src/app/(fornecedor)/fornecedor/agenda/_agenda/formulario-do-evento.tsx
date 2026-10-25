"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { criarEventoDoFornecedor } from "@/actions/vendor-panel-actions";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";
import { SelecaoNativa } from "@/components/ui/select";
import { AreaDeTexto } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { TipoDeEventoDoFornecedor } from "../../../_lib/vendor-panel";
import { ESTILO_DO_BOTAO_SECUNDARIO, type OpcaoDePedido } from "./tipos";

export type PedidoDoFormulario = { kind: TipoDeEventoDoFornecedor; date: string };
type Valores = { date: string; time: string; title: string; leadId: string; notes: string };
type MudarCampo = (key: keyof Valores) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;

interface PropriedadesDosCampos {
  uid: string;
  isMeeting: boolean;
  values: Valores;
  set: MudarCampo;
  leads: OpcaoDePedido[];
}

function CamposDoEvento({ uid, isMeeting, values, set, leads }: PropriedadesDosCampos) {
  const linkedLead = leads.find((l) => l.id === values.leadId);
  const sugestao = linkedLead ? `Reunião com ${linkedLead.label.split(" · ")[0]}` : "Ex.: Reunião online com Ana & Rafael";
  return (
    <>
      <div className={cn("grid gap-5", isMeeting && "grid-cols-1 min-[420px]:grid-cols-2")}>
        <Entrada id={`${uid}-data`} label="Data" type="date" required value={values.date} onChange={set("date")} />
        {isMeeting ? <Entrada id={`${uid}-hora`} label="Horário" type="time" required value={values.time} onChange={set("time")} /> : null}
      </div>
      {isMeeting ? (
        <SelecaoNativa id={`${uid}-pedido`} label="Pedido" optional value={values.leadId} onChange={set("leadId")}>
          <option value="">Sem pedido vinculado</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </SelecaoNativa>
      ) : null}
      <Entrada
        id={`${uid}-titulo`}
        label={isMeeting ? "Título" : "Motivo"}
        optional={!isMeeting || Boolean(linkedLead)}
        maxLength={120}
        value={values.title}
        onChange={set("title")}
        placeholder={isMeeting ? sugestao : "Ex.: viagem, outro evento"}
      />
      {isMeeting ? (
        <AreaDeTexto id={`${uid}-notas`} label="Observações" optional rows={3} maxLength={1000} value={values.notes} onChange={set("notes")} placeholder="Link da chamada, endereço, o que levar…" inputClassName="min-h-24" />
      ) : (
        <p className="text-sm text-tinta-suave">Datas bloqueadas aparecem como ocupadas nos seus pedidos de orçamento.</p>
      )}
    </>
  );
}

export function FormularioDoEvento({ request, leads, onDone }: { request: PedidoDoFormulario; leads: OpcaoDePedido[]; onDone: () => void }) {
  const isMeeting = request.kind === "MEETING";
  const [values, setValues] = useState<Valores>({ date: request.date, time: "", title: "", leadId: "", notes: "" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const uid = useId();
  const set: MudarCampo = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await criarEventoDoFornecedor({ kind: request.kind, ...values });
      if (!res.success) return setError(res.error ?? "Não foi possível salvar.");
      toast.success(isMeeting ? "Reunião marcada na agenda." : "Data bloqueada na agenda.");
      onDone();
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {error ? (
        <p role="alert" className="rounded-xl bg-perigo-suave px-4 py-3 text-sm font-medium text-perigo">
          {error}
        </p>
      ) : null}
      <CamposDoEvento uid={uid} isMeeting={isMeeting} values={values} set={set} leads={leads} />
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onDone} disabled={isPending} className={ESTILO_DO_BOTAO_SECUNDARIO}>
          Cancelar
        </button>
        <Botao type="submit" loading={isPending}>
          {isMeeting ? "Marcar reunião" : "Bloquear data"}
        </Botao>
      </div>
    </form>
  );
}
