import { useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Check, Download, Gift } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { estiloDoBotao } from "@/components/landing/styles";
import { Selo } from "@/components/landing/seal";
import { caminhoDoSiteDoCasamento } from "@/lib/casamento/wedding-links";
import { cn } from "@/lib/utils";
import { estiloDoSobretitulo, estiloDoTitulo, type ConvidadoDaConfirmacao, type PropriedadesDaEtapa } from "./tipos";

function salvarIngresso(canvas: HTMLCanvasElement | null | undefined, nome: string | undefined) {
  if (!canvas) return;
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `ingresso-${nome?.replace(/\s+/g, "-").toLowerCase()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success("O ingresso foi salvo no seu aparelho.");
}

function IngressoComQr({ guest }: { guest: ConvidadoDaConfirmacao | null }) {
  const qrRef = useRef<HTMLDivElement>(null);
  return (
    <div className="mt-2 flex w-full flex-col items-center gap-4 rounded-[16px] border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)]">
      <p className={estiloDoSobretitulo}>Código QR para a entrada</p>
      <div ref={qrRef} className="rounded-[12px] border border-linha bg-papel p-4">
        <QRCodeCanvas value={`GUEST:${guest?.id ?? ""}`} size={168} level="H" />
      </div>
      <strong className="text-lg font-semibold">{guest?.name}</strong>
      <p className="text-sm text-tinta-suave">Este código QR serve para o registro de entrada na festa, se os noivos usarem esse recurso. Salve a imagem no celular, caso a internet falhe lá.</p>
      <button type="button" onClick={() => salvarIngresso(qrRef.current?.querySelector("canvas"), guest?.name)} className={cn(estiloDoBotao.secondary, estiloDoBotao.block)}>
        <Download aria-hidden="true" className="size-4" />
        Salvar como imagem
      </button>
    </div>
  );
}

interface PropriedadesDaConfirmada extends PropriedadesDaEtapa {
  guest: ConvidadoDaConfirmacao | null;
  slug: string;
  companionsCount: number;
  aoMudarResposta: () => void;
}

export function EtapaConfirmada({ titulo, guest, slug, companionsCount, aoMudarResposta }: PropriedadesDaConfirmada) {
  const confirmedPeople = companionsCount + 1;
  return (
    <section aria-labelledby="titulo" className="step-in flex flex-col items-center gap-4 pt-4 text-center">
      <Selo label="Selo de confirmação" className="size-24 [&>span]:text-[54px]" />
      <h1 ref={titulo} id="titulo" tabIndex={-1} className="mt-2 font-display text-[40px] font-medium leading-[46px] tracking-[-0.015em] text-tinta outline-none">
        Que alegria!
      </h1>
      <p className="max-w-[32ch] text-tinta-suave">
        {companionsCount === 0
          ? "A sua presença está confirmada. Mal podemos esperar para viver esse momento com você."
          : `A sua presença e a de ${companionsCount === 1 ? "1 acompanhante" : `${companionsCount} acompanhantes`} estão confirmadas.`}
      </p>
      <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-sucesso-suave px-3 text-sm font-semibold text-sucesso">
        <Check aria-hidden="true" className="size-4" strokeWidth={2.25} />
        {confirmedPeople === 1 ? "1 confirmado" : `${confirmedPeople} confirmados`}
      </span>

      <IngressoComQr guest={guest} />

      <div className="flex w-full flex-col rounded-[16px] border border-linha bg-papel px-6 py-4 text-left shadow-[var(--shadow-aceito-1)]">
        <p className={cn(estiloDoSobretitulo, "mb-1")}>E agora?</p>
        <Link href={caminhoDoSiteDoCasamento(slug, "presentes")} className="flex min-h-12 items-center gap-3 font-semibold text-tinta no-underline">
          <Gift aria-hidden="true" className="size-5 text-ameixa" strokeWidth={1.6} />
          <span className="flex-1">Ver os presentes em dinheiro</span>
          <ArrowRight aria-hidden="true" className="size-4 text-tinta-suave" />
        </Link>
      </div>

      <button type="button" onClick={aoMudarResposta} className={cn(estiloDoBotao.quiet, "mt-2")}>
        Mudar minha resposta
      </button>
    </section>
  );
}

export function EtapaRecusada({ titulo, coupleNames, aoMudarResposta }: PropriedadesDaEtapa & { coupleNames: string; aoMudarResposta: () => void }) {
  return (
    <section aria-labelledby="titulo" className="step-in flex flex-col items-center gap-4 pt-8 text-center">
      <h1 ref={titulo} id="titulo" tabIndex={-1} className={cn(estiloDoTitulo, "text-balance")}>
        Que pena, vamos sentir sua falta
      </h1>
      <p className="max-w-[34ch] text-tinta-suave">Avisamos {coupleNames}. Se os planos mudarem, é só voltar aqui e responder de novo.</p>
      <button type="button" onClick={aoMudarResposta} className={cn(estiloDoBotao.secondary, "mt-4")}>
        Mudar minha resposta
      </button>
    </section>
  );
}
