"use client";

import { BellRing, Smartphone } from "lucide-react";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { cn } from "@/lib/utils";
import { AtivarNoRodape, BotaoDeTeste, CartaoVerificando, ESTILO_DO_BOTAO, ESTILO_DO_CARTAO, InstrucoesDoPush, textoDoCartao } from "./push-card-partes";
import { InterruptorDeAlternancia } from "./toggle-switch";
import { usePushAcoes } from "./use-push-acoes";
import { useSuporteAoPush } from "./use-push-state";

interface Propriedades {
  /** Chave pública VAPID; sem ela (ambiente sem push) o cartão nem aparece. */
  publicKey: string | null;
  /** "compact": uma linha, só quando falta ativar (rodapé do sino). "card": cartão completo. */
  variant?: "card" | "compact";
  className?: string;
}

export function CartaoDoPush({ publicKey, variant = "card", className }: Propriedades) {
  const support = useSuporteAoPush();
  const { subscribed, busy, testing, enable, disable, test } = usePushAcoes(support, publicKey);

  if (!publicKey) return null;
  if (support === "checking") return variant === "compact" ? null : <CartaoVerificando className={className} />;

  const needsActivation = support === "default" || (support === "granted" && subscribed === false);

  if (variant === "compact") return needsActivation ? <AtivarNoRodape busy={busy} aoAtivar={enable} className={className} /> : null;

  const on = support === "granted" && subscribed === true;

  return (
    <section aria-labelledby="push-card-titulo" className={cn(ESTILO_DO_CARTAO, className)}>
      <div className="flex items-start gap-3.5">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-ameixa-suave text-ameixa">
          <Smartphone className="size-5" strokeWidth={1.6} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="push-card-titulo" className="text-base font-semibold text-tinta">
            Avisos neste aparelho
          </h3>
          <p className="mt-0.5 text-[15px] leading-[22px] text-tinta-suave">{textoDoCartao(on, support)}</p>
        </div>
        {support === "granted" && (
          <InterruptorDeAlternancia checked={on} onChange={(next) => void (next ? enable() : disable())} label="Avisos neste aparelho" busy={busy || subscribed === null} />
        )}
      </div>

      <InstrucoesDoPush support={support} />

      {needsActivation && (
        <BotaoComCarregamento onClick={enable} loading={busy} className={cn(ESTILO_DO_BOTAO, "w-fit bg-ameixa text-on-ameixa hover:bg-ameixa-hover")}>
          <BellRing aria-hidden="true" className="size-4" />
          Ativar avisos neste aparelho
        </BotaoComCarregamento>
      )}
      {on && <BotaoDeTeste testing={testing} aoTestar={test} />}
    </section>
  );
}
