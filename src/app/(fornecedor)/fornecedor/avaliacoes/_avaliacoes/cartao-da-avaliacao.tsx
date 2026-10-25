import { EyeOff, Flag, ShieldCheck } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { EtiquetaBase } from "../../../_components/status-chip";
import { formatarDataDoCasamento } from "../../../_lib/datas-do-painel";
import { DenunciarAvaliacao } from "../report-review";
import { RespostaAAvaliacao } from "../review-reply";
import { Estrelas } from "../stars";
import { formatarDataCurta, type Avaliacao } from "./dados";
import { ESTILO_DO_CARTAO } from "./estilos";

function EtiquetasDaAvaliacao({ review }: { review: Avaliacao }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {review.isVerified ? <EtiquetaBase tone="sucesso" icon={ShieldCheck}>Verificada</EtiquetaBase> : null}
      {review.hiddenAt ? <EtiquetaBase tone="neutro" icon={EyeOff}>Ocultada pela equipe do Aceito</EtiquetaBase> : null}
      {review.reportedAt && !review.moderatedAt && !review.hiddenAt ? <EtiquetaBase tone="aviso" icon={Flag}>Denúncia em análise</EtiquetaBase> : null}
      <Estrelas rating={review.rating} label={`${review.rating} de 5 estrelas`} />
    </div>
  );
}

function subtituloDaAvaliacao(review: Avaliacao, now: Date) {
  const date = formatarDataDoCasamento(review.weddingDate);
  if (!date) return `Avaliou em ${formatarDataCurta(review.createdAt, now)}`;
  const married = review.weddingDate ? review.weddingDate.getTime() <= now.getTime() : false;
  return `${married ? "Casaram em" : "Casamento em"} ${date}`;
}

interface PropriedadesDoCartao {
  review: Avaliacao;
  now: Date;
  destaque: boolean;
  atraso: number;
}

export function CartaoDaAvaliacao({ review, now, destaque, atraso }: PropriedadesDoCartao) {
  return (
    <Aparicao as="li" variant="up" delay={atraso}>
      <article aria-labelledby={`avaliacao-${review.id}`} className={cn(ESTILO_DO_CARTAO, "flex flex-col gap-3 p-4 sm:p-6", destaque && "border-2 border-ameixa")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h3 id={`avaliacao-${review.id}`} className="text-[17px] font-semibold break-words">
              {review.coupleNames}
            </h3>
            <p className="text-sm text-tinta-suave">{subtituloDaAvaliacao(review, now)}</p>
          </div>
          <EtiquetasDaAvaliacao review={review} />
        </div>
        <p className="font-display text-lg leading-7 whitespace-pre-line break-words sm:text-xl sm:leading-[30px]">“{review.comment}”</p>
        {!review.reportedAt || review.moderatedAt ? <DenunciarAvaliacao reviewId={review.id} coupleNames={review.coupleNames} /> : null}
        <RespostaAAvaliacao
          reviewId={review.id}
          coupleNames={review.coupleNames}
          reply={review.reply}
          repliedLabel={review.repliedAt ? formatarDataCurta(review.repliedAt, now) : null}
          placeholder={review.rating >= 4 ? "Agradeça e conte algo do dia que vocês lembram" : "Agradeça o retorno e, se fizer sentido, explique o que aconteceu"}
        />
      </article>
    </Aparicao>
  );
}
