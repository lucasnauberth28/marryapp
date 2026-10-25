"use client";

import { useEffect, useRef } from "react";
import { EtapaDeBusca } from "./componentes/etapa-busca";
import { EtapaDoConvite } from "./componentes/etapa-convite";
import { EtapaConfirmada, EtapaRecusada } from "./componentes/etapas-finais";
import type { PropriedadesDaConfirmacaoCliente } from "./componentes/tipos";
import { useConfirmacao } from "./componentes/use-confirmacao";

/** Ao trocar de etapa o foco vai para o título: quem usa leitor de tela ouve a nova etapa. */
function useFocoNoTitulo(titulo: React.RefObject<HTMLHeadingElement | null>, stage: string) {
  const primeiraRenderizacao = useRef(true);
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    titulo.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage, titulo]);
}

export function ConfirmacaoCliente({ slug, coupleNames, dateLabel, locationName }: PropriedadesDaConfirmacaoCliente) {
  const c = useConfirmacao(slug);
  const titulo = useRef<HTMLHeadingElement>(null);
  useFocoNoTitulo(titulo, c.stage);

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col px-4 py-8 sm:py-14">
      {c.stage === "busca" ? <EtapaDeBusca titulo={titulo} c={c} /> : null}
      {c.stage === "convite" && c.guest ? <EtapaDoConvite titulo={titulo} c={c} guest={c.guest} coupleNames={coupleNames} dateLabel={dateLabel} locationName={locationName} /> : null}
      {c.stage === "CONFIRMED" ? <EtapaConfirmada titulo={titulo} guest={c.guest} slug={slug} companionsCount={c.acompanhantes.count} aoMudarResposta={c.voltarAoConvite} /> : null}
      {c.stage === "DECLINED" ? <EtapaRecusada titulo={titulo} coupleNames={coupleNames} aoMudarResposta={c.voltarAoConvite} /> : null}
    </div>
  );
}
