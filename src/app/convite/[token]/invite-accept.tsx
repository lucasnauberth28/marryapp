"use client";

import { Heart, LogOut } from "lucide-react";
import { sair } from "@/actions/auth-actions";
import { TituloDoMolde } from "@/components/account/auth-shell";
import { estiloDoBotao } from "@/components/landing/styles";
import { AvisoDoFormulario } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { AceiteDeQuemTemConta } from "./componentes/aceite-com-conta";
import { AceiteDeQuemNaoTemConta } from "./componentes/aceite-sem-conta";
import type { Visitante } from "./componentes/tipos";

export type { Visitante };

export function AceiteDoConvite({ token, coupleNames, viewer, googleAtivo }: { token: string; coupleNames: string; viewer: Visitante; googleAtivo: boolean }) {
  return (
    <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
      <span className="grid size-14 place-items-center rounded-full bg-ameixa-suave text-ameixa">
        <Heart aria-hidden="true" className="size-7" strokeWidth={1.6} />
      </span>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">Você foi convidado para organizar</p>
        <TituloDoMolde title={coupleNames} text="Entre no casamento para ver e editar tudo junto: convidados, site, presentes e finanças." />
      </div>

      {viewer.kind === "member" ? <AceiteDeQuemTemConta token={token} viewer={viewer} /> : null}
      {viewer.kind === "anonymous" ? <AceiteDeQuemNaoTemConta token={token} googleAtivo={googleAtivo} /> : null}
      {viewer.kind === "blocked" ? (
        <div className="flex flex-col gap-4">
          <AvisoDoFormulario>{viewer.reason}</AvisoDoFormulario>
          <p className="text-[15px] text-tinta-suave">Depois de sair, abra o link do convite de novo.</p>
          <button type="button" onClick={() => sair()} className={cn(estiloDoBotao.secondary, estiloDoBotao.block, "min-h-12")}>
            <LogOut aria-hidden="true" className="size-4" />
            Sair desta conta
          </button>
        </div>
      ) : null}
    </section>
  );
}
