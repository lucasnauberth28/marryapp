"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2, Star } from "lucide-react";
import { submitLeadReview } from "@/actions/vendor-review-actions";
import { cn } from "@/lib/utils";
import { TOKEN_CARD } from "@/components/public/token-page-shell";

const STAR_LABEL = ["", "Ruim", "Regular", "Bom", "Muito bom", "Excelente"];

export function ReviewForm({ token, companyName }: { token: string; companyName: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"sent" | "already" | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Escolha de 1 a 5 estrelas.");
      return;
    }
    startTransition(async () => {
      const res = await submitLeadReview({ token, rating, comment });
      if (res.success) {
        setDone("sent");
        router.refresh();
      } else if (res.alreadyReviewed) {
        setDone("already");
      } else {
        setError(res.error);
      }
    });
  }

  if (done) {
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

  const length = comment.trim().length;

  return (
    <section aria-labelledby="avaliar-titulo" className={cn(TOKEN_CARD, "flex flex-col gap-4")}>
      <h2 id="avaliar-titulo" className="sr-only">
        Sua avaliação
      </h2>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5" aria-describedby={error ? "avaliar-erro" : undefined}>
        {error ? (
          <p id="avaliar-erro" role="alert" className="rounded-xl bg-perigo-suave px-4 py-3 text-sm font-medium text-perigo">
            {error}
          </p>
        ) : null}

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
                  onChange={() => setRating(n)}
                  className="sr-only"
                />
                <Star
                  aria-hidden="true"
                  className={cn("size-9 transition-colors", n <= rating ? "fill-amber-400 text-amber-400" : "text-linha-forte")}
                />
                <span className="sr-only">
                  {n} {n === 1 ? "estrela" : "estrelas"} ({STAR_LABEL[n]})
                </span>
              </label>
            ))}
            <span className="ml-2 text-sm font-semibold text-tinta-suave" aria-hidden="true">
              {rating > 0 ? STAR_LABEL[rating] : ""}
            </span>
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="avaliar-comentario" className="text-sm font-semibold text-tinta">
            Conte como foi
          </label>
          <textarea
            id="avaliar-comentario"
            rows={5}
            minLength={10}
            maxLength={2000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Atendimento, pontualidade, qualidade e como ficou o resultado no grande dia."
            aria-describedby="avaliar-comentario-dica"
            className="min-h-32 w-full resize-y rounded-xl border border-linha-forte bg-papel px-4 py-3 text-base text-tinta placeholder:text-tinta-suave/80"
          />
          <p id="avaliar-comentario-dica" className="text-[13px] text-tinta-suave">
            De 10 a 2.000 caracteres ({length}).
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ameixa px-5 text-base font-semibold text-on-ameixa transition-colors hover:bg-ameixa-hover disabled:pointer-events-none disabled:opacity-60"
        >
          {isPending ? <Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> : null}
          {isPending ? "Enviando…" : "Enviar avaliação"}
        </button>
      </form>
    </section>
  );
}
