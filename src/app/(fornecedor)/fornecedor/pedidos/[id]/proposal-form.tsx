"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, Check, Copy, Link2, Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { saveLeadProposal } from "@/actions/vendor-panel-actions";
import { cn } from "@/lib/utils";

const INPUT =
  "min-h-11 w-full rounded-xl border border-linha-forte bg-papel px-4 text-base text-tinta placeholder:text-tinta-suave/80 disabled:opacity-60";
const BTN =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";

export interface SavedProposal {
  /** "hoje, 14:20" */
  sentAtLabel: string;
  /** Texto pronto para o casal (WhatsApp ou copiar). */
  text: string;
  whatsappUrl: string | null;
  /** Link público para o casal ver e aceitar a proposta. */
  publicUrl: string | null;
  /** Registro do aceite digital (nome digitado pelo casal e quando). */
  accepted: { name: string; atLabel: string } | null;
}

export function ProposalForm({
  leadId,
  todayIso,
  initial,
  saved,
}: {
  leadId: string;
  todayIso: string;
  initial: { amount: string; validUntil: string; details: string };
  saved: SavedProposal | null;
}) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const set = (key: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setJustSaved(false);
    setValues((v) => ({ ...v, [key]: e.target.value }));
  };

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveLeadProposal({ leadId, ...values });
      if (res.success) {
        setJustSaved(true);
        toast.success("Proposta registrada no pedido.");
      } else {
        const message = res.error ?? "Não foi possível salvar a proposta.";
        setError(message);
        toast.error(message);
      }
    });
  }

  async function copyText(text: string, done = "Texto da proposta copiado.") {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(done);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  }

  const linkBox = saved?.publicUrl ? (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="proposta-link" className="text-sm font-semibold text-tinta">
        Link da proposta para o casal
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="proposta-link"
          readOnly
          value={saved.publicUrl}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(INPUT, "flex-1 text-sm")}
        />
        <button
          type="button"
          onClick={() => copyText(saved.publicUrl!, "Link da proposta copiado.")}
          className={cn(BTN, "border border-linha-forte bg-papel text-tinta hover:bg-areia")}
        >
          <Link2 aria-hidden="true" className="size-[18px]" />
          Copiar link
        </button>
      </div>
    </div>
  ) : null;

  if (saved?.accepted) {
    return (
      <div className="flex flex-col gap-4">
        <div role="status" className="flex flex-col gap-1 rounded-xl bg-sucesso-suave p-4">
          <p className="flex items-start gap-2 text-[15px]">
            <BadgeCheck aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-sucesso" />
            <strong className="font-semibold">
              Proposta aceita por {saved.accepted.name} em {saved.accepted.atLabel}.
            </strong>
          </p>
          <p className="pl-[26px] text-sm text-tinta-suave">
            Aceite digital registrado pelo link da proposta (nome completo, data e hora). Agora é com você: envie o
            contrato ao casal.
          </p>
        </div>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase">Valor</dt>
            <dd className="text-[17px] font-semibold">R$ {initial.amount}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase">Registrada</dt>
            <dd className="text-[17px] font-semibold">{saved.sentAtLabel}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:col-span-2">
            <dt className="text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase">O que está incluído</dt>
            <dd className="text-[15px] whitespace-pre-line break-words">{initial.details}</dd>
          </div>
        </dl>
        {linkBox}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {saved ? (
        <div
          role="status"
          className={cn(
            "flex flex-col gap-3 rounded-xl p-4",
            justSaved ? "bg-sucesso-suave" : "border border-linha bg-linho",
          )}
        >
          <p className="flex items-start gap-2 text-[15px]">
            <Check aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-sucesso" />
            <span>
              <strong className="font-semibold">
                {justSaved ? "Proposta registrada neste pedido." : `Proposta registrada ${saved.sentAtLabel}.`}
              </strong>{" "}
              <span className="text-tinta-suave">
                {saved.whatsappUrl
                  ? "Abra no seu WhatsApp para enviar ao casal: a mensagem já vai pronta."
                  : "Copie o texto e envie ao casal pelo canal que vocês combinaram."}
              </span>
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {saved.whatsappUrl ? (
              <a
                href={saved.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(BTN, "bg-ameixa text-on-ameixa hover:bg-ameixa-hover")}
              >
                <MessageCircle aria-hidden="true" className="size-[18px]" />
                Enviar no WhatsApp
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => copyText(saved.text)}
              className={cn(BTN, "border border-linha-forte bg-papel text-tinta hover:bg-areia")}
            >
              <Copy aria-hidden="true" className="size-[18px]" />
              Copiar texto
            </button>
          </div>
          {linkBox}
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4" aria-describedby={error ? "proposta-erro" : undefined}>
        {error ? (
          <p id="proposta-erro" role="alert" className="rounded-xl bg-perigo-suave px-4 py-3 text-sm font-medium text-perigo">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="proposta-valor" className="text-sm font-semibold text-tinta">
              Valor
            </label>
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-tinta-suave">
                R$
              </span>
              <input
                id="proposta-valor"
                name="amount"
                inputMode="decimal"
                autoComplete="off"
                required
                maxLength={20}
                placeholder="7.800"
                value={values.amount}
                onChange={set("amount")}
                aria-describedby="proposta-valor-dica"
                className={cn(INPUT, "pl-11")}
              />
            </div>
            <p id="proposta-valor-dica" className="text-[13px] text-tinta-suave">
              Em reais, por exemplo 7.800 ou 7.800,50.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="proposta-validade" className="text-sm font-semibold text-tinta">
              Vale até <span className="font-normal text-tinta-suave">(opcional)</span>
            </label>
            <input
              id="proposta-validade"
              name="validUntil"
              type="date"
              min={todayIso}
              value={values.validUntil}
              onChange={set("validUntil")}
              className={INPUT}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="proposta-inclui" className="text-sm font-semibold text-tinta">
            O que está incluído
          </label>
          <textarea
            id="proposta-inclui"
            name="details"
            required
            rows={4}
            maxLength={4000}
            placeholder="Ex.: cobertura de 10 horas, 2 fotógrafos, ensaio pré-wedding e 600 fotos tratadas em galeria online."
            value={values.details}
            onChange={set("details")}
            className={cn(INPUT, "min-h-28 resize-y py-3")}
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isPending} className={cn(BTN, "bg-ameixa text-on-ameixa hover:bg-ameixa-hover")}>
            {isPending ? (
              <Loader2 aria-hidden="true" className="size-[18px] animate-spin" />
            ) : (
              <Send aria-hidden="true" className="size-[18px]" />
            )}
            {isPending ? "Salvando…" : saved ? "Atualizar proposta" : "Registrar proposta"}
          </button>
        </div>
      </form>
    </div>
  );
}
