"use client";

import { useState, useTransition } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { declineLead } from "@/actions/vendor-panel-actions";
import { cn } from "@/lib/utils";
import { whatsappHref } from "../../../_lib/vendor-panel";

const BTN =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";

/** "Não é para você?": recusa o pedido com uma mensagem gentil para o casal. */
export function DeclineLead({
  leadId,
  couplePhone,
  defaultMessage,
  declined,
}: {
  leadId: string;
  couplePhone: string;
  defaultMessage: string;
  /** Preenchido quando o pedido já foi recusado. */
  declined: { atLabel: string | null; message: string | null } | null;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(defaultMessage);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (declined) {
    const waUrl = declined.message ? whatsappHref(couplePhone, declined.message) : null;
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-linha bg-areia/60 p-5">
        <strong className="text-[15px] font-semibold">
          Pedido recusado{declined.atLabel ? ` ${declined.atLabel}` : ""}
        </strong>
        {declined.message ? (
          <p className="text-sm whitespace-pre-line break-words text-tinta-suave">“{declined.message}”</p>
        ) : null}
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(BTN, "w-fit border border-linha-forte bg-papel text-tinta hover:bg-areia")}
          >
            <MessageCircle aria-hidden="true" className="size-[18px]" />
            Enviar mensagem no WhatsApp
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        ) : null}
        <p className="text-[13px] text-tinta-suave">Para reabrir o pedido, mude o status em Andamento.</p>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await declineLead({ leadId, message });
      if (res.success) {
        toast.success("Pedido recusado. Agora é só avisar o casal.");
        setOpen(false);
      } else {
        const msg = res.error ?? "Não foi possível recusar o pedido.";
        setError(msg);
        toast.error(msg);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-linha bg-areia/60 p-5">
      <strong className="text-[15px] font-semibold">Não é para você?</strong>
      <span className="text-sm text-tinta-suave">
        Avise o casal com uma mensagem gentil. O pedido sai da sua lista e fica em “Recusados”.
      </span>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(BTN, "-ml-3 w-fit text-ameixa hover:bg-areia")}
        >
          Recusar com mensagem
        </button>
      ) : (
        <form id="recusar-form" onSubmit={onSubmit} className="mt-2 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recusar-mensagem" className="text-sm font-semibold text-tinta">
              Mensagem para o casal
            </label>
            <textarea
              id="recusar-mensagem"
              // O botão "Recusar com mensagem" some ao abrir: o foco vai direto para a mensagem.
              autoFocus
              rows={5}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-describedby="recusar-dica"
              className="min-h-28 w-full resize-y rounded-xl border border-linha-forte bg-papel px-4 py-3 text-base text-tinta"
            />
            <p id="recusar-dica" className="text-[13px] text-tinta-suave">
              Depois de recusar, a mensagem abre pronta no seu WhatsApp para você enviar.
            </p>
          </div>
          {error ? (
            <p role="alert" className="rounded-xl bg-perigo-suave px-4 py-3 text-sm font-medium text-perigo">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={isPending} className={cn(BTN, "bg-perigo text-white hover:opacity-90")}>
              {isPending ? <Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> : null}
              Recusar pedido
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setOpen(false)}
              className={cn(BTN, "border border-linha-forte bg-papel text-tinta hover:bg-areia")}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
