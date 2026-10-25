"use client";

import { useEffect, useRef } from "react";
import { MoldeDeAcesso, FOTOS_DO_MOLDE } from "@/components/account/auth-shell";
import { EtapaDeDados } from "./componentes/etapa-dados";
import { EtapaPronta } from "./componentes/etapa-pronta";
import { useDadosDoInicio, type Resultado, type ValoresIniciais } from "./componentes/use-dados-do-inicio";

/** Ao trocar de etapa o foco vai para o título: quem usa leitor de tela ouve a nova etapa. */
function useFocoNoTitulo(titulo: React.RefObject<HTMLHeadingElement | null>, step: string) {
  const primeiraRenderizacao = useRef(true);
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    titulo.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, titulo]);
}

/**
 * Uma tela só: nomes e data (a data é opcional). Cidade, faixa de convidados e cor do site não são
 * mais perguntadas aqui; a cor e o local ficam em Editar o site, quando o casal for preparar o site.
 */
export function FluxoDeBoasVindas({
  firstName,
  initial,
  done,
}: {
  firstName: string;
  initial: ValoresIniciais;
  /** Casamento recém-configurado: abre direto na tela final. */
  done: Resultado | null;
}) {
  const d = useDadosDoInicio(initial, done);
  const titulo = useRef<HTMLHeadingElement>(null);
  useFocoNoTitulo(titulo, d.step);

  return (
    <MoldeDeAcesso photo={d.step === "pronto" ? FOTOS_DO_MOLDE.pronto : FOTOS_DO_MOLDE.boasVindas} footnote="Nomes e data podem ser alterados depois, em Editar o site.">
      {d.step === "dados" ? <EtapaDeDados titulo={titulo} firstName={firstName} d={d} /> : null}
      {d.step === "pronto" && d.result ? <EtapaPronta titulo={titulo} result={d.result} /> : null}
    </MoldeDeAcesso>
  );
}
