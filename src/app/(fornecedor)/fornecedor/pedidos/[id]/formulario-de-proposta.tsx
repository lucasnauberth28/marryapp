"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { salvarPropostaDoPedido } from "@/actions/fornecedor/pedidos";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { PropostaAceita } from "./_proposta/proposta-aceita";
import { PropostaRegistrada } from "./_proposta/proposta-registrada";
import type { PropostaSalva, ValoresDaProposta } from "./_proposta/tipos";

export type { PropostaSalva } from "./_proposta/tipos";

type MudarCampo = (key: keyof ValoresDaProposta) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

function CamposDaProposta({ values, todayIso, set }: { values: ValoresDaProposta; todayIso: string; set: MudarCampo }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Entrada
          id="proposta-valor"
          label="Valor"
          prefix="R$"
          hint="Em reais, por exemplo 7.800 ou 7.800,50."
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          required
          maxLength={20}
          placeholder="7.800"
          value={values.amount}
          onChange={set("amount")}
        />
        <Entrada id="proposta-validade" label="Vale até" optional name="validUntil" type="date" min={todayIso} value={values.validUntil} onChange={set("validUntil")} />
      </div>
      <AreaDeTexto
        id="proposta-inclui"
        label="O que está incluído"
        name="details"
        required
        rows={4}
        maxLength={4000}
        placeholder="Ex.: cobertura de 10 horas, 2 fotógrafos, ensaio pré-wedding e 600 fotos tratadas em galeria online."
        value={values.details}
        onChange={set("details")}
        inputClassName="min-h-28"
      />
    </>
  );
}

interface PropriedadesDoFormulario {
  leadId: string;
  todayIso: string;
  initial: ValoresDaProposta;
  saved: PropostaSalva | null;
}

export function FormularioDeProposta({ leadId, todayIso, initial, saved }: PropriedadesDoFormulario) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const set: MudarCampo = (key) => (e) => {
    setJustSaved(false);
    setValues((v) => ({ ...v, [key]: e.target.value }));
  };

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await salvarPropostaDoPedido({ leadId, ...values });
      if (res.success) {
        setJustSaved(true);
        return void toast.success("Proposta registrada no pedido.");
      }
      const message = res.error ?? "Não foi possível salvar a proposta.";
      setError(message);
      toast.error(message);
    });
  }

  if (saved?.accepted) return <PropostaAceita saved={{ ...saved, accepted: saved.accepted }} valores={initial} />;

  return (
    <div className="flex flex-col gap-4">
      {saved ? <PropostaRegistrada saved={saved} recemSalva={justSaved} /> : null}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5" aria-describedby={error ? "proposta-erro" : undefined}>
        {error ? (
          <p id="proposta-erro" role="alert" className="rounded-xl bg-perigo-suave px-4 py-3 text-sm font-medium text-perigo">
            {error}
          </p>
        ) : null}
        <CamposDaProposta values={values} todayIso={todayIso} set={set} />
        <div className="flex justify-end">
          <Botao type="submit" loading={isPending}>
            <Send aria-hidden="true" className="size-[18px]" />
            {saved ? "Atualizar proposta" : "Registrar proposta"}
          </Botao>
        </div>
      </form>
    </div>
  );
}
