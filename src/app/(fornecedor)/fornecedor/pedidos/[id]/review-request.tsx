"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Link2, Loader2, MessageCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { requestLeadReview } from "@/actions/vendor-panel-actions";
import { cn } from "@/lib/utils";
import { whatsappHref } from "../../../_lib/vendor-panel";

const BTN =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";

/** Pedido fechado: gera o link de avaliação verificada e abre a mensagem pronta no WhatsApp. */
export function ReviewRequest({
  leadId,
  coupleName,
  couplePhone,
  companyName,
  url: initialUrl,
  requestedAtLabel,
  review,
}: {
  leadId: string;
  coupleName: string;
  couplePhone: string;
  companyName: string;
  url: string | null;
  requestedAtLabel: string | null;
  review: { rating: number; atLabel: string } | null;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [isPending, startTransition] = useTransition();

  if (review) {
    return (
      <section aria-labelledby="avaliacao-titulo" className="flex flex-col gap-1.5 rounded-2xl border border-linha bg-papel p-5">
        <h2 id="avaliacao-titulo" className="text-[15px] font-semibold">
          Avaliação recebida
        </h2>
        <p className="flex items-center gap-1.5 text-sm text-tinta-suave">
          <Star aria-hidden="true" className="size-4 fill-amber-400 text-amber-400" />
          {review.rating} de 5 estrelas · {review.atLabel}
        </p>
        <Link href="/fornecedor/avaliacoes" className="text-sm font-semibold text-ameixa underline-offset-2 hover:underline">
          Ver e responder em Avaliações
        </Link>
      </section>
    );
  }

  const text = url
    ? `Olá, ${coupleName}! Aqui é ${companyName}. Foi uma alegria fazer parte do casamento de vocês! Se puderem, contem como foi a experiência, leva só um minutinho: ${url}`
    : "";
  const waUrl = url ? whatsappHref(couplePhone, text) : null;

  function generate() {
    startTransition(async () => {
      const res = await requestLeadReview(leadId);
      if (res.success) {
        setUrl(res.url);
        toast.success("Link de avaliação pronto. Envie ao casal.");
      } else {
        toast.error(res.error);
      }
    });
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link de avaliação copiado.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o link e copie manualmente.");
    }
  }

  return (
    <section aria-labelledby="avaliacao-titulo" className="flex flex-col gap-2 rounded-2xl border border-linha bg-papel p-5">
      <h2 id="avaliacao-titulo" className="text-[15px] font-semibold">
        Pedir avaliação
      </h2>
      <p className="text-sm text-tinta-suave">
        O casal recebe um link só dele. A avaliação aparece no seu perfil com o selo “Casamento Verificado”.
      </p>
      {!url ? (
        <button
          type="button"
          onClick={generate}
          disabled={isPending}
          className={cn(BTN, "w-full bg-ameixa text-on-ameixa hover:bg-ameixa-hover")}
        >
          {isPending ? <Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> : <Star aria-hidden="true" className="size-[18px]" />}
          Pedir avaliação
        </button>
      ) : (
        <>
          {requestedAtLabel ? <p className="text-[13px] text-tinta-suave">Link gerado {requestedAtLabel}.</p> : null}
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(BTN, "w-full bg-ameixa text-on-ameixa hover:bg-ameixa-hover")}
            >
              <MessageCircle aria-hidden="true" className="size-[18px]" />
              Enviar no WhatsApp
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          ) : null}
          <label htmlFor="avaliacao-link" className="sr-only">
            Link de avaliação
          </label>
          <input
            id="avaliacao-link"
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="min-h-11 w-full rounded-xl border border-linha-forte bg-papel px-3 text-sm text-tinta"
          />
          <button
            type="button"
            onClick={copy}
            className={cn(BTN, "w-full border border-linha-forte bg-papel text-tinta hover:bg-areia")}
          >
            <Link2 aria-hidden="true" className="size-[18px]" />
            Copiar link
          </button>
        </>
      )}
    </section>
  );
}
