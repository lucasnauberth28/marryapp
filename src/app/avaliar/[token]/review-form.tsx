"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Star } from "lucide-react";
import { enviarAvaliacaoDoPedido } from "@/actions/vendor-review-actions";
import { Botao } from "@/components/ui/button";
import { AreaDeTexto } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CARTAO_DA_PAGINA_COM_TOKEN } from "@/components/public/token-page-shell";

const ROTULO_DAS_ESTRELAS = ["", "Ruim", "Regular", "Bom", "Muito bom", "Excelente"];

function AvaliacaoEnviada({ done, companyName }: { done: "sent" | "already"; companyName: string }) {
  return (
    <section role="status" className="flex flex-col gap-2 rounded-2xl bg-sucesso-suave p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-sucesso">
        <BadgeCheck aria-hidden="true" className="size-5" />
        {done === "sent" ? "Avaliação enviada. Obrigado!" : "Avaliação já enviada"}
      </h2>
      <p>Ela aparece no perfil de {companyName} com o selo “Casamento Verificado” e ajuda outros casais a escolher.</p>
    </section>
  );
}

function EscolhaDeEstrelas({ rating, aoEscolher }: { rating: number; aoEscolher: (n: number) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold text-tinta">Sua nota</legend>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded-lg p-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ameixa">
            <input
              type="radio"
              name="rating"
              value={n}
              checked={rating === n}
              onChange={() => aoEscolher(n)}
              className="sr-only"
            />
            <Star
              aria-hidden="true"
              className={cn("size-9 transition-colors", n <= rating ? "fill-amber-400 text-amber-400" : "text-linha-forte")}
            />
            <span className="sr-only">
              {n} {n === 1 ? "estrela" : "estrelas"} ({ROTULO_DAS_ESTRELAS[n]})
            </span>
          </label>
        ))}
        <span className="ml-2 text-sm font-semibold text-tinta-suave" aria-hidden="true">
          {rating > 0 ? ROTULO_DAS_ESTRELAS[rating] : ""}
        </span>
      </div>
    </fieldset>
  );
}

function useEnvioDaAvaliacao(token: string) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"sent" | "already" | null>(null);
  const [isPending, startTransition] = useTransition();

  function enviar(rating: number, comment: string) {
    setError(null);
    if (rating < 1) return setError("Escolha de 1 a 5 estrelas.");
    startTransition(async () => {
      const res = await enviarAvaliacaoDoPedido({ token, rating, comment });
      if (res.success) {
        setDone("sent");
        router.refresh();
      } else if (res.alreadyReviewed) setDone("already");
      else setError(res.error);
    });
  }

  return { error, done, isPending, enviar };
}

export function FormularioDeAvaliacao({ token, companyName }: { token: string; companyName: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { error, done, isPending, enviar } = useEnvioDaAvaliacao(token);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    enviar(rating, comment);
  };

  if (done) return <AvaliacaoEnviada done={done} companyName={companyName} />;

  const length = comment.trim().length;

  return (
    <section aria-labelledby="avaliar-titulo" className={cn(CARTAO_DA_PAGINA_COM_TOKEN, "flex flex-col gap-4")}>
      <h2 id="avaliar-titulo" className="sr-only">
        Sua avaliação
      </h2>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5" aria-describedby={error ? "avaliar-erro" : undefined}>
        {error ? (
          <p id="avaliar-erro" role="alert" className="rounded-xl bg-perigo-suave px-4 py-3 text-sm font-medium text-perigo">
            {error}
          </p>
        ) : null}

        <EscolhaDeEstrelas rating={rating} aoEscolher={setRating} />

        <AreaDeTexto
          id="avaliar-comentario"
          label="Conte como foi"
          rows={5}
          minLength={10}
          maxLength={2000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Atendimento, pontualidade, qualidade e como ficou o resultado no grande dia."
          hint={`De 10 a 2.000 caracteres (${length}).`}
          inputClassName="min-h-32"
        />

        <Botao type="submit" loading={isPending} className="h-12">
          Enviar avaliação
        </Botao>
      </form>
    </section>
  );
}
