"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Link2, Loader2, MessageCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { pedirAvaliacaoDoPedido } from "@/actions/fornecedor/pedidos-resposta";
import { Entrada } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { linkDoWhatsapp } from "../../../_lib/links-publicos";

const ESTILO_DO_BOTAO =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";
const BOTAO_PRINCIPAL = cn(ESTILO_DO_BOTAO, "w-full bg-ameixa text-on-ameixa hover:bg-ameixa-hover");

function AvaliacaoRecebida({ review }: { review: { rating: number; atLabel: string } }) {
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

async function copiarLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link de avaliação copiado.");
  } catch {
    toast.error("Não foi possível copiar. Selecione o link e copie manualmente.");
  }
}

/** O link já gerado: enviar pelo WhatsApp ou copiar. */
function LinkDeAvaliacao({ url, waUrl, requestedAtLabel }: { url: string; waUrl: string | null; requestedAtLabel: string | null }) {
  return (
    <>
      {requestedAtLabel ? <p className="text-[13px] text-tinta-suave">Link gerado {requestedAtLabel}.</p> : null}
      {waUrl ? (
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className={BOTAO_PRINCIPAL}>
          <MessageCircle aria-hidden="true" className="size-[18px]" />
          Enviar no WhatsApp
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      ) : null}
      <Entrada id="avaliacao-link" label="Link de avaliação" readOnly value={url} onFocus={(e) => e.currentTarget.select()} inputClassName="text-sm" />
      <button type="button" onClick={() => void copiarLink(url)} className={cn(ESTILO_DO_BOTAO, "w-full border border-linha-forte bg-papel text-tinta hover:bg-areia")}>
        <Link2 aria-hidden="true" className="size-[18px]" />
        Copiar link
      </button>
    </>
  );
}

interface PropriedadesDoPedidoDeAvaliacao {
  leadId: string;
  coupleName: string;
  couplePhone: string;
  companyName: string;
  url: string | null;
  requestedAtLabel: string | null;
  review: { rating: number; atLabel: string } | null;
}

/** Pedido fechado: gera o link de avaliação verificada e abre a mensagem pronta no WhatsApp. */
export function PedidoDeAvaliacao({ leadId, coupleName, couplePhone, companyName, url: initialUrl, requestedAtLabel, review }: PropriedadesDoPedidoDeAvaliacao) {
  const [url, setUrl] = useState(initialUrl);
  const [isPending, startTransition] = useTransition();
  if (review) return <AvaliacaoRecebida review={review} />;

  const text = `Olá, ${coupleName}! Aqui é ${companyName}. Foi uma alegria fazer parte do casamento de vocês! Se puderem, contem como foi a experiência, leva só um minutinho: ${url}`;

  function gerar() {
    startTransition(async () => {
      const res = await pedirAvaliacaoDoPedido(leadId);
      if (!res.success) return void toast.error(res.error);
      setUrl(res.url);
      toast.success("Link de avaliação pronto. Envie ao casal.");
    });
  }

  return (
    <section aria-labelledby="avaliacao-titulo" className="flex flex-col gap-2 rounded-2xl border border-linha bg-papel p-5">
      <h2 id="avaliacao-titulo" className="text-[15px] font-semibold">
        Pedir avaliação
      </h2>
      <p className="text-sm text-tinta-suave">O casal recebe um link só dele. A avaliação aparece no seu perfil com o selo “Casamento Verificado”.</p>
      {!url ? (
        <button type="button" onClick={gerar} disabled={isPending} className={BOTAO_PRINCIPAL}>
          {isPending ? <Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> : <Star aria-hidden="true" className="size-[18px]" />}
          Pedir avaliação
        </button>
      ) : (
        <LinkDeAvaliacao url={url} waUrl={linkDoWhatsapp(couplePhone, text)} requestedAtLabel={requestedAtLabel} />
      )}
    </section>
  );
}
