"use client";

import { useEffect, useRef, useState } from "react";
import { BASE, type Passo, type Resposta } from "./tipos";

/** Depois de trocar a tela do convite, devolve o foco a um botão dela (quem usa teclado não se perde). */
function useFocoDepoisDeTrocar(corpo: React.RefObject<HTMLElement | null>, dependencias: unknown[]) {
  const foco = useRef<string | null>(null);
  useEffect(() => {
    if (!foco.current) return;
    corpo.current?.querySelector<HTMLElement>(foco.current)?.focus();
    foco.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só troca de tela / de escolha
  }, dependencias);
  return (seletor: string) => {
    foco.current = seletor;
  };
}

/** O estado do convite de exemplo: a pessoa responde e o painel conta. `corpo` é a seção da tela do celular. */
export function useDemo(corpo: React.RefObject<HTMLElement | null>) {
  const [passo, setPasso] = useState<Passo>("inicio");
  const [resp, setResp] = useState<Resposta | null>(null);
  const [pessoas, setPessoas] = useState<1 | 2>(2);
  const [enviado, setEnviado] = useState(false);
  const [novo, setNovo] = useState(false);
  const focarEm = useFocoDepoisDeTrocar(corpo, [passo, enviado, pessoas]);

  const totais = {
    confirmados: BASE.confirmados + (enviado && resp === "sim" ? 1 : 0),
    semResposta: BASE.semResposta - (enviado ? 1 : 0),
  };

  const registrar = (r: Resposta) => {
    setResp(r);
    setEnviado(true);
    setNovo(true);
    setPasso("inicio");
    focarEm('[data-a="alterar"]');
  };
  const responder = (r: Resposta) => {
    if (r === "nao") return registrar(r);
    setResp(r);
    setPasso("pessoas");
    focarEm('[data-a="p2"]');
  };
  const escolherPessoas = (n: 1 | 2) => {
    setPessoas(n);
    focarEm(`[data-a="p${n}"]`);
  };
  const voltar = () => {
    setPasso("inicio");
    focarEm('[data-a="sim"]');
  };
  const alterar = () => {
    setEnviado(false);
    setNovo(false);
    voltar();
  };

  return { passo, resp, pessoas, enviado, novo, totais, responder, escolherPessoas, enviar: () => registrar("sim"), voltar, alterar };
}
