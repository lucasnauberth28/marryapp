"use client";

import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { recusarPedido } from "@/actions/vendor-panel-actions";
import { Botao } from "@/components/ui/button";
import { AreaDeTexto } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { linkDoWhatsapp } from "../../../_lib/vendor-panel";

const ESTILO_DO_BOTAO =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";

/** "Não é para você?": recusa o pedido com uma mensagem gentil para o casal. */
export function RecusarPedido({
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
    const waUrl = declined.message ? linkDoWhatsapp(couplePhone, declined.message) : null;
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
            className={cn(ESTILO_DO_BOTAO, "w-fit border border-linha-forte bg-papel text-tinta hover:bg-areia")}
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
      const res = await recusarPedido({ leadId, message });
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
          className={cn(ESTILO_DO_BOTAO, "-ml-3 w-fit text-ameixa hover:bg-areia")}
        >
          Recusar com mensagem
        </button>
      ) : (
        <form id="recusar-form" onSubmit={onSubmit} className="mt-2 flex flex-col gap-3">
          <AreaDeTexto
            id="recusar-mensagem"
            label="Mensagem para o casal"
            hint="Depois de recusar, a mensagem abre pronta no seu WhatsApp para você enviar."
            // O botão "Recusar com mensagem" some ao abrir: o foco vai direto para a mensagem.
            autoFocus
            rows={5}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            inputClassName="min-h-28"
          />
          {error ? (
            <p role="alert" className="rounded-xl bg-perigo-suave px-4 py-3 text-sm font-medium text-perigo">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Botao type="submit" loading={isPending} className="bg-perigo text-white hover:bg-perigo hover:opacity-90">
              Recusar pedido
            </Botao>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setOpen(false)}
              className={cn(ESTILO_DO_BOTAO, "border border-linha-forte bg-papel text-tinta hover:bg-areia")}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
