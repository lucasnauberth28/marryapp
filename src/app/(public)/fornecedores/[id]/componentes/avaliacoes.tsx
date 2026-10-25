import { CheckCircle2, Star } from "lucide-react";
import type { FornecedorPublico } from "@/actions/vitrine/consulta";
import { cn } from "@/lib/utils";
import { estiloDoTituloDaSecao } from "./estilos";

type Avaliacao = FornecedorPublico["reviews"][number];

function Estrelas({ nota }: { nota: number }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${nota} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} aria-hidden="true" className={cn("size-4", i < nota ? "fill-champanhe text-champanhe" : "text-linha-forte")} />
      ))}
    </div>
  );
}

function CartaoDeAvaliacao({ rev, companyName }: { rev: Avaliacao; companyName: string }) {
  return (
    <figure className="m-0 flex flex-col gap-3 rounded-[16px] border border-linha bg-papel p-6 shadow-aceito-1">
      <Estrelas nota={rev.rating} />
      <blockquote className="m-0 font-display text-xl leading-7 text-tinta">“{rev.comment}”</blockquote>
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tinta-suave">
        <span>
          {rev.coupleNames}
          {rev.weddingDate ? ` · casou em ${new Date(rev.weddingDate).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}` : ""}
        </span>
        {rev.isVerified ? (
          <span className="inline-flex min-h-6 items-center gap-1 rounded-[6px] bg-sucesso-suave pl-1.5 pr-2 text-sm font-semibold text-sucesso">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Casamento confirmado
          </span>
        ) : null}
      </figcaption>
      {rev.reply ? (
        <div className="rounded-[12px] border-l-2 border-rosa bg-areia/60 px-4 py-3">
          <p className="text-sm font-semibold text-tinta-suave">Resposta de {companyName}</p>
          <p className="whitespace-pre-line break-words text-base leading-6 text-tinta">{rev.reply}</p>
        </div>
      ) : null}
    </figure>
  );
}

export function SecaoDeAvaliacoes({ reviews, companyName }: { reviews: Avaliacao[]; companyName: string }) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby="avaliacoes">
      <div className="flex flex-col gap-1">
        <h2 id="avaliacoes" className={estiloDoTituloDaSecao}>
          O que os casais dizem
        </h2>
        <p className="text-sm text-tinta-suave">Só quem fechou pelo Aceito recebe o link para avaliar.</p>
      </div>
      {reviews.length === 0 ? (
        <p className="rounded-[16px] border border-linha bg-papel p-6 text-base text-tinta-suave shadow-aceito-1">Ainda não há avaliações de casais que fecharam por aqui.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((rev) => (
            <CartaoDeAvaliacao key={rev.id} rev={rev} companyName={companyName} />
          ))}
        </div>
      )}
    </section>
  );
}
