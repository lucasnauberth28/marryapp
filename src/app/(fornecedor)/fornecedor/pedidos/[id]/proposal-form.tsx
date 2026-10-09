"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Loader2, MessageCircle, Send } from "lucide-react";
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

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Texto da proposta copiado.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
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
