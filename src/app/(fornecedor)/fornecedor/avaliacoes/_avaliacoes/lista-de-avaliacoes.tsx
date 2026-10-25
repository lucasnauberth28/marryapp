import Link from "next/link";
import { LinkPendente } from "@/components/feedback/link-pending";
import { cn } from "@/lib/utils";
import { CartaoDaAvaliacao } from "./cartao-da-avaliacao";
import type { Avaliacao, FiltroDeAvaliacoes } from "./dados";
import { CAMINHO_DA_PAGINA } from "./estilos";
import { TudoRespondido } from "./sem-avaliacoes";

function FiltrosDeAvaliacoes({ filter, unansweredCount, total }: { filter: FiltroDeAvaliacoes; unansweredCount: number; total: number }) {
  const filters: { value: FiltroDeAvaliacoes; label: string; count: number }[] = [
    { value: "sem-resposta", label: "Sem resposta", count: unansweredCount },
    { value: "todas", label: "Todas", count: total },
  ];
  return (
    <nav aria-label="Filtrar avaliações">
      <ul className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <li key={f.value}>
            <Link
              href={`${CAMINHO_DA_PAGINA}?filtro=${f.value}`}
              aria-current={f.value === filter ? "page" : undefined}
              scroll={false}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors",
                f.value === filter ? "border-ameixa bg-ameixa-suave text-ameixa" : "border-linha bg-papel text-tinta-suave hover:border-linha-forte hover:text-tinta",
              )}
            >
              {f.label} · {f.count}
              <LinkPendente label="Carregando as avaliações" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

interface PropriedadesDaLista {
  reviews: Avaliacao[];
  filter: FiltroDeAvaliacoes;
  unansweredCount: number;
  total: number;
}

export function ListaDeAvaliacoes({ reviews, filter, unansweredCount, total }: PropriedadesDaLista) {
  const now = new Date();
  const firstUnansweredId = reviews.find((r) => !r.reply)?.id;
  return (
    <section aria-labelledby="lista-avaliacoes" className="group/lista flex flex-col gap-3">
      <h2 id="lista-avaliacoes" className="sr-only">
        {filter === "sem-resposta" ? "Avaliações sem resposta" : "Todas as avaliações"}
      </h2>
      <FiltrosDeAvaliacoes filter={filter} unansweredCount={unansweredCount} total={total} />
      {reviews.length === 0 ? (
        <TudoRespondido />
      ) : (
        <ul className="flex flex-col gap-3 transition-opacity group-has-[[data-link-pending]]/lista:opacity-60">
          {reviews.map((review, i) => (
            <CartaoDaAvaliacao key={review.id} review={review} now={now} destaque={review.id === firstUnansweredId} atraso={Math.min(i, 5) * 80} />
          ))}
        </ul>
      )}
    </section>
  );
}
