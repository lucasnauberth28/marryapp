import Link from "next/link";
import { ArrowLeft, ArrowRight, MousePointerClick } from "lucide-react";
import { Botao } from "@/components/ui/button";
import { IlustracaoDaLiz } from "@/components/liz/liz-illustration";
import type { Posicionamento } from "@/lib/tour/positioning";
import type { PassoDoTour } from "@/lib/tour/steps";
import type { TourConcluido } from "./ancora";

/** Seta do balão apontando para o item destacado. */
function SetaDoBalao({ side, offset }: { side: Exclude<Posicionamento["side"], "center">; offset: number }) {
  const common = "absolute size-3 rotate-45 border-linha bg-papel";
  if (side === "right") return <span aria-hidden="true" className={`${common} -left-1.5 border-b border-l`} style={{ top: offset - 6 }} />;
  if (side === "left") return <span aria-hidden="true" className={`${common} -right-1.5 border-r border-t`} style={{ top: offset - 6 }} />;
  if (side === "bottom") return <span aria-hidden="true" className={`${common} -top-1.5 border-l border-t`} style={{ left: offset - 6 }} />;
  return <span aria-hidden="true" className={`${common} -bottom-1.5 border-b border-r`} style={{ left: offset - 6 }} />;
}

interface Propriedades {
  dialogRef: React.RefObject<HTMLDivElement | null>;
  step: PassoDoTour;
  index: number;
  total: number;
  isLast: boolean;
  where: string | null;
  posicao: Posicionamento | null;
  aoVoltar: () => void;
  aoAvancar: () => void;
  aoPular: () => void;
  aoConcluir: (done: TourConcluido) => void;
}

function CabecalhoDoBalao({ index, total, aoPular }: { index: number; total: number; aoPular: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-semibold leading-5 text-tinta-suave" aria-hidden="true">
        Passo {index + 1} de {total}
      </p>
      <Botao variant="quiet" size="sm" onClick={aoPular} className="-mr-2 -mt-1">
        Pular
      </Botao>
    </div>
  );
}

function ConteudoDoPasso({ step, where }: { step: PassoDoTour; where: string | null }) {
  return (
    <>
      <div className="flex items-start gap-3">
        {/* Passo da Liz: ela mesma cumprimenta (decorativa, o título já diz "Liz") */}
        {step.id === "liz" && <IlustracaoDaLiz pose="cumprimentando" height={112} decorative className="h-28 w-auto shrink-0" />}
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 id="tour-passo-titulo" className="font-display text-[22px] font-medium leading-7 text-tinta">
            {step.title}
          </h2>
          <p id="tour-passo-texto" className="text-base leading-6 text-tinta-suave">
            {step.what}
          </p>
        </div>
      </div>

      {where && (
        <p className="flex items-start gap-2 rounded-xl bg-ameixa-suave px-3 py-2.5 text-[15px] leading-5 text-tinta">
          <MousePointerClick className="mt-0.5 size-4 shrink-0 text-ameixa" aria-hidden="true" />
          <span>{where}</span>
        </p>
      )}
    </>
  );
}

interface PropriedadesDoRodape {
  step: PassoDoTour;
  index: number;
  isLast: boolean;
  aoVoltar: () => void;
  aoAvancar: () => void;
  aoConcluir: (done: TourConcluido) => void;
}

function RodapeDoBalao({ step, index, isLast, aoVoltar, aoAvancar, aoConcluir }: PropriedadesDoRodape) {
  return (
    <div className="flex flex-col gap-2">
      {step.cta && step.href && (
        <Botao asChild variant="outline">
          <Link href={step.href} onClick={() => aoConcluir({ outcome: isLast ? "completed" : "skipped", navigated: true })}>
            {step.cta}
          </Link>
        </Botao>
      )}
      <div className="flex gap-2">
        <Botao variant="ghost" onClick={aoVoltar} disabled={index === 0} className="flex-1">
          <ArrowLeft aria-hidden="true" />
          Voltar
        </Botao>
        <Botao onClick={aoAvancar} className="flex-1">
          {isLast ? "Concluir" : "Próximo"}
          {!isLast && <ArrowRight aria-hidden="true" />}
        </Botao>
      </div>
    </div>
  );
}

export function BalaoDoTour({ dialogRef, step, index, total, isLast, where, posicao, aoVoltar, aoAvancar, aoPular, aoConcluir }: Propriedades) {
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-passo-titulo"
      aria-describedby="tour-passo-texto"
      tabIndex={-1}
      style={posicao ? { top: posicao.top, left: posicao.left } : { top: 0, left: 0 }}
      className={`absolute flex w-[min(360px,calc(100vw-24px))] flex-col gap-3 rounded-2xl border border-linha bg-papel p-4 text-tinta shadow-[var(--shadow-aceito-2)] outline-none md:p-5 ${posicao ? "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200" : "invisible"}`}
    >
      {posicao && posicao.side !== "center" && <SetaDoBalao side={posicao.side} offset={posicao.arrow} />}
      <CabecalhoDoBalao index={index} total={total} aoPular={aoPular} />
      <ConteudoDoPasso step={step} where={where} />
      <RodapeDoBalao step={step} index={index} isLast={isLast} aoVoltar={aoVoltar} aoAvancar={aoAvancar} aoConcluir={aoConcluir} />
    </div>
  );
}
