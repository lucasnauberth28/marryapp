"use client";

import { useState } from "react";
import { ROTULO_DA_TAXA_DO_PRESENTE, calcularValoresDoPresente, type PlanoDaTaxaDoPresente } from "@/lib/gift-fee";
import { formatarCentavos, interpretarCentavos } from "./home-money";
import { formatarReais } from "@/lib/formatacao/dinheiro";

/**
 * Simulador de presente por Pix. A conta é a mesma do painel e do checkout (giftAmounts):
 * no Básico vale a taxa do Aceito; no Classic e no VIP o Pix não tem taxa.
 */
export function SimuladorDePresentes({ classicLabel, vipLabel }: { classicLabel: string; vipLabel: string }) {
  const [plano, setPlano] = useState<PlanoDaTaxaDoPresente>("basic");
  const [texto, setTexto] = useState("200,00");
  const cents = interpretarCentavos(texto);
  const valor = cents ?? 0;
  const { feeCents, netCents } = calcularValoresDoPresente(valor, plano, "PIX");

  return (
    <div className="lp-simulador">
      <div className="lp-abas" role="group" aria-label="Plano">
        <button type="button" aria-pressed={plano === "basic"} onClick={() => setPlano("basic")}>
          Básico
        </button>
        <button type="button" aria-pressed={plano !== "basic"} onClick={() => setPlano("classic")}>
          {classicLabel} ou {vipLabel}
        </button>
      </div>
      <div className="lp-sim-bloco">
        <label htmlFor="lp-v-presente">Valor do presente por Pix</label>
        <div className="lp-valor">
          <span aria-hidden="true">R$</span>
          <input
            id="lp-v-presente"
            inputMode="decimal"
            autoComplete="off"
            value={texto}
            aria-describedby={cents === null ? "lp-v-erro" : undefined}
            aria-invalid={cents === null}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => {
              if (cents !== null) setTexto(formatarCentavos(cents));
            }}
          />
        </div>
        {cents === null ? (
          <p id="lp-v-erro" className="lp-sim-erro">
            Digitem um valor, como 200,00.
          </p>
        ) : null}
      </div>
      <div className="lp-sim-bloco" aria-live="polite">
        <span className="lp-r">Vocês recebem</span>
        <p className="lp-recebe">
          <small>R$</small>
          {formatarCentavos(netCents)}
        </p>
        <div className="lp-sim-linhas">
          <div>
            <span>{plano === "basic" ? `Taxa do Aceito (${ROTULO_DA_TAXA_DO_PRESENTE})` : "Taxa do Aceito no Pix"}</span>
            <b>{feeCents ? `− ${formatarReais(feeCents)}` : formatarReais(0)}</b>
          </div>
          <div>
            <span>Quem presenteia paga</span>
            <b>{formatarReais(valor)}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
