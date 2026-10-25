import { Gift as GiftIcon } from "lucide-react";
import { Botao } from "@/components/ui/button";
import { AvisoDoFormulario } from "@/components/ui/field";
import { estiloDoBotao } from "@/components/landing/styles";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import type { PresenteLocal as Gift } from "@/types/local";
import { cn } from "@/lib/utils";
import { CamposDoCartao } from "./campos-do-cartao";
import { ESTILO_DO_SOBRETITULO, ESTILO_DO_TITULO, type FormaDePagamento, type PropriedadesDoPasso } from "./tipos";
import type { CartaoDigitado } from "./use-dados-do-pagamento";

interface Opcao {
  id: FormaDePagamento;
  label: string;
  hint: string;
  value: string;
}

function OpcaoDeForma({ opt, selecionada, aoEscolher }: { opt: Opcao; selecionada: boolean; aoEscolher: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selecionada}
      onClick={aoEscolher}
      className={cn(
        "flex min-h-16 cursor-pointer flex-col gap-0.5 rounded-[12px] p-3 text-left transition-[border-color,background-color] duration-200",
        selecionada ? "border-2 border-ameixa bg-ameixa-suave p-[11px]" : "border border-linha-forte bg-papel hover:border-tinta-suave",
      )}
    >
      <span className="flex items-center gap-2 font-semibold text-tinta">
        <span aria-hidden="true" className={cn("grid size-4 shrink-0 place-items-center rounded-full border", selecionada ? "border-ameixa" : "border-linha-forte")}>
          {selecionada ? <span className="size-2 rounded-full bg-ameixa" /> : null}
        </span>
        {opt.label}
      </span>
      <span className="text-sm leading-5 text-tinta-suave">{opt.hint}</span>
      <span className="text-base font-semibold tabular-nums text-tinta">{opt.value}</span>
    </button>
  );
}

interface PropriedadesDoResumo {
  gift: Gift;
  coupleNames: string;
  guestName: string;
  method: FormaDePagamento;
  cardFinalAmount: number;
}

/** Antes de pagar: para quem vai o presente, quanto será cobrado e o que o Aceito retém. */
function ResumoAntesDePagar({ gift, coupleNames, guestName, method, cardFinalAmount }: PropriedadesDoResumo) {
  const noCartao = method === "CREDIT_CARD";
  return (
    <section aria-labelledby="checkout-resumo" className="flex flex-col gap-3 rounded-[16px] border border-linha bg-areia p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-papel text-ameixa">
          <GiftIcon className="size-5" strokeWidth={1.6} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="checkout-resumo" className="font-semibold leading-6 text-tinta">
            O presente é para {coupleNames}
          </h3>
          <p className="text-sm leading-5 text-tinta-suave">
            {guestName.trim() ? `De ${guestName.trim()}. ` : ""}
            {gift.title}.
          </p>
        </div>
      </div>
      <dl className="flex flex-col gap-1.5 border-t border-linha pt-3 text-[15px] leading-6">
        {noCartao ? (
          <>
            <LinhaDeValor rotulo="Presente" valor={gift.amount} />
            <LinhaDeValor rotulo="Tarifa do cartão" valor={cardFinalAmount - gift.amount} />
          </>
        ) : null}
        <div className="flex items-baseline justify-between gap-3 font-semibold">
          <dt className="text-tinta">Você paga</dt>
          <dd className="font-num text-2xl leading-8 tabular-nums text-tinta">{formatarReais(noCartao ? cardFinalAmount : gift.amount)}</dd>
        </div>
      </dl>
      <p className="text-sm leading-5 text-tinta-suave">
        {noCartao ? "Esse é o valor que será cobrado no cartão, já com a tarifa. " : "Esse é o valor do Pix, sem acréscimo. "}
        Se o plano do casal tiver taxa, o Aceito a retém do valor do presente. Ela não é somada ao que você paga.
      </p>
    </section>
  );
}

const LinhaDeValor = ({ rotulo, valor }: { rotulo: string; valor: number }) => (
  <div className="flex items-baseline justify-between gap-3">
    <dt className="text-tinta-suave">{rotulo}</dt>
    <dd className="tabular-nums text-tinta">{formatarReais(valor)}</dd>
  </div>
);

interface Propriedades extends PropriedadesDoPasso {
  gift: Gift;
  coupleNames: string;
  guestName: string;
  cardEnabled: boolean;
  cardFinalAmount: number;
  method: FormaDePagamento;
  aoEscolherForma: (forma: FormaDePagamento) => void;
  cartao: CartaoDigitado;
  error: string | null;
  carregando: boolean;
  aoPagar: () => void;
  aoVoltar: () => void;
}

export function PassoDaFormaDePagamento({ titulo, gift, coupleNames, guestName, cardEnabled, cardFinalAmount, method, aoEscolherForma, cartao, error, carregando, aoPagar, aoVoltar }: Propriedades) {
  const opcoes: Opcao[] = [
    { id: "PIX", label: "Pix", hint: "À vista, sem juros", value: formatarReais(gift.amount) },
    ...(cardEnabled ? [{ id: "CREDIT_CARD" as const, label: "Cartão", hint: "Em até 12x, com juros do cartão", value: formatarReais(cardFinalAmount) }] : []),
  ];
  return (
    <div className="step-in flex flex-col gap-5 pt-2">
      <div className="flex flex-col gap-2">
        <p className={ESTILO_DO_SOBRETITULO}>Passo 2 de 3</p>
        <h2 ref={titulo} tabIndex={-1} className={ESTILO_DO_TITULO}>
          Forma de pagamento
        </h2>
        <p className="text-tinta-suave">{cardEnabled ? "Escolha como prefere pagar." : "O pagamento é por Pix."}</p>
      </div>

      <div className={cn("grid grid-cols-1 gap-2", cardEnabled && "min-[420px]:grid-cols-2")} role="radiogroup" aria-label="Forma de pagamento">
        {opcoes.map((opt) => (
          <OpcaoDeForma key={opt.id} opt={opt} selecionada={method === opt.id} aoEscolher={() => aoEscolherForma(opt.id)} />
        ))}
      </div>

      {method === "CREDIT_CARD" && <CamposDoCartao cartao={cartao} valorTotal={cardFinalAmount} />}

      <ResumoAntesDePagar gift={gift} coupleNames={coupleNames} guestName={guestName} method={method} cardFinalAmount={cardFinalAmount} />

      {error ? <AvisoDoFormulario>{error}</AvisoDoFormulario> : null}

      <div className="flex flex-col gap-2">
        <Botao type="button" onClick={aoPagar} loading={carregando} className="h-12 w-full rounded-[12px] px-6">
          {method === "PIX" ? "Gerar Pix" : "Pagar com cartão"}
        </Botao>
        <button type="button" onClick={aoVoltar} className={cn(estiloDoBotao.quiet, estiloDoBotao.block)}>
          Voltar
        </button>
      </div>
    </div>
  );
}
