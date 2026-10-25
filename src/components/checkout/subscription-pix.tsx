"use client";

import { Botao } from "@/components/ui/button";
import { CartaoDoPix } from "./pix/cartao";
import { EsqueletoDoPix } from "./pix/esqueleto";
import { useCobrancaDoPix } from "./pix/use-cobranca";

interface PropriedadesDoPixDaAssinatura {
  planId: string;
  modules?: string[];
  planName: string;
  /** Cupom já conferido na prévia; o servidor confere de novo ao gerar o Pix. */
  couponCode?: string | null;
  /** Chamado uma vez, quando o pagamento é confirmado (o plano já foi ativado no servidor). */
  onPaid: () => void;
}

/**
 * Cobrança Pix de um plano: gera o código para a conta logada, mostra QR e copia e cola,
 * conta os 10 minutos e confere o pagamento sozinha a cada 5 segundos.
 */
export function PixDaAssinatura({ planId, modules, planName, couponCode, onPaid }: PropriedadesDoPixDaAssinatura) {
  const p = useCobrancaDoPix({ planId, modules, couponCode, onPaid });

  if (p.error && !p.charge) {
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-[16px] border border-perigo/25 bg-perigo-suave p-5 text-sm font-semibold text-perigo">
        {p.error}
        <Botao type="button" variant="outline" size="sm" loading={p.isPending} onClick={p.regenerate} className="self-start rounded-[12px]">
          Tentar de novo
        </Botao>
      </div>
    );
  }
  if (!p.charge) return <EsqueletoDoPix />;

  return (
    <div className="flex flex-col gap-4">
      <CartaoDoPix planName={planName} charge={p.charge} expired={p.expired} secondsLeft={p.secondsLeft} copied={p.copied} isPending={p.isPending} aoCopiar={p.copy} aoGerarNovo={p.regenerate} />
      {!p.expired ? (
        <Botao type="button" loading={p.isPending} onClick={p.checkNow} className="h-12 w-full rounded-[12px]">
          Já paguei
        </Botao>
      ) : null}
      {p.message ? (
        <p role="status" className="text-center text-sm text-tinta-suave">
          {p.message}
        </p>
      ) : null}
    </div>
  );
}
