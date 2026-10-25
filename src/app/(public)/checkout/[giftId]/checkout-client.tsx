"use client";

import { useEffect, useRef } from "react";
import { PassoDeIdentificacao } from "./componentes/passo-identificacao";
import { PassoDaFormaDePagamento } from "./componentes/passo-forma-de-pagamento";
import { PassoDoPix } from "./componentes/passo-pix";
import { PassoDeSucesso, PassoDoCartaoEmAnalise } from "./componentes/passos-finais";
import { ResumoDoPresente } from "./componentes/resumo-do-presente";
import type { PropriedadesDoPagamentoCliente } from "./componentes/tipos";
import { usePagamento } from "./componentes/use-pagamento";

/** Ao trocar de etapa o foco vai para o título: quem usa leitor de tela ouve a nova etapa. */
function useFocoNoTitulo(titulo: React.RefObject<HTMLHeadingElement | null>, step: string) {
  const primeiraRenderizacao = useRef(true);
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    titulo.current?.focus({ preventScroll: true });
  }, [step, titulo]);
}

export function PagamentoCliente({ gift, coupleNames, slug, cardEnabled = true, cardAmount }: PropriedadesDoPagamentoCliente) {
  const p = usePagamento(gift.id, slug);
  const { step, method } = p;

  const titulo = useRef<HTMLHeadingElement>(null);
  useFocoNoTitulo(titulo, step);

  return (
    <div className="flex flex-col gap-4">
      <ResumoDoPresente gift={gift} coupleNames={coupleNames} />

      {step === "IDENTIFICATION" && <PassoDeIdentificacao titulo={titulo} identificacao={p.identificacao} coupleNames={coupleNames} error={p.error} aoContinuar={p.continuarDaIdentificacao} />}

      {step === "METHOD" && (
        <PassoDaFormaDePagamento
          titulo={titulo}
          gift={gift}
          coupleNames={coupleNames}
          guestName={p.identificacao.name}
          cardEnabled={cardEnabled}
          cardFinalAmount={cardAmount}
          method={method}
          aoEscolherForma={p.setMethod}
          cartao={p.cartao}
          error={p.error}
          carregando={p.isPending}
          aoPagar={p.processar}
          aoVoltar={() => p.setStep("IDENTIFICATION")}
        />
      )}

      {step === "PAYMENT" && method === "PIX" && (
        <PassoDoPix
          titulo={titulo}
          pix={p.pix}
          aoAvisar={() => {
            p.pix.setAvisado(true);
            p.setStep("SUCCESS");
          }}
          aoVoltar={() => p.setStep("METHOD")}
        />
      )}

      {step === "PAYMENT" && method === "CREDIT_CARD" && <PassoDoCartaoEmAnalise titulo={titulo} />}

      {step === "SUCCESS" && <PassoDeSucesso titulo={titulo} coupleNames={coupleNames} slug={slug} amount={gift.amount} pixAvisado={p.pix.avisado} />}
    </div>
  );
}
