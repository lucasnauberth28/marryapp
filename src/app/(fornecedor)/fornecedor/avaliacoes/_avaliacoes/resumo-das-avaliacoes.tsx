import { Aparicao } from "@/components/motion/reveal";
import { pluralizar } from "@/lib/formatacao/plural";
import { cn } from "@/lib/utils";
import { Estrelas } from "../stars";
import { ESTILO_DO_CARTAO } from "./estilos";

const umaCasaDecimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

interface PropriedadesDoResumo {
  total: number;
  average: number;
  unansweredCount: number;
  distribution: { stars: number; count: number }[];
}

export function ResumoDasAvaliacoes({ total, average, unansweredCount, distribution }: PropriedadesDoResumo) {
  const averageLabel = umaCasaDecimal.format(average);
  return (
    <Aparicao variant="up">
      <section aria-label="Resumo das avaliações" className={cn(ESTILO_DO_CARTAO, "flex flex-wrap items-center gap-6 p-5 sm:gap-8 sm:p-6")}>
        <div className="flex min-w-[180px] flex-col gap-1.5">
          <span className="font-num text-[56px] leading-[56px] sm:text-[64px] sm:leading-[64px]" aria-hidden="true">
            {averageLabel}
          </span>
          <Estrelas rating={average} label={`Nota média ${averageLabel} de 5`} />
          <span className="text-sm text-tinta-suave">
            {pluralizar(total, "avaliação", "avaliações")} · {unansweredCount} sem resposta
          </span>
        </div>
        <ul aria-label="Distribuição das notas" className="flex min-w-0 flex-[1_1_280px] flex-col gap-2">
          {distribution.map(({ stars, count }) => (
            <li key={stars} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2.5 text-sm">
              <span>{pluralizar(stars, "estrela", "estrelas")}</span>
              <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-areia">
                <span className="block h-full rounded-full bg-champanhe" style={{ width: `${Math.round((count / total) * 100)}%` }} />
              </span>
              <span className="text-right tabular-nums text-tinta-suave">
                {count}
                <span className="sr-only"> {count === 1 ? "avaliação" : "avaliações"}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </Aparicao>
  );
}
