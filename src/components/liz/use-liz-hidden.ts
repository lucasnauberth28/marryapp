"use client";

import { useSyncExternalStore } from "react";

// Quando o botão da Liz some: passo a passo do primeiro acesso ativo, janela (modal) aberta, tela cheia
// ou uma tela que pede o espaço todo (marca `data-liz-hide`, como o leitor de código QR em uso).
// Lê o DOM em vez de depender de cada tela avisar: funciona com qualquer janela do painel.

// O passo a passo marca o <body> com este atributo; lido sem importar o módulo dele.
const ATRIBUTO_DO_TOUR_ATIVO = "data-tour-active";

const SELETOR_DE_MODAL = '[role="dialog"][aria-modal="true"]:not([data-liz-panel]), [role="alertdialog"], [data-slot="dialog-content"]';

function assinarMudancas(onChange: () => void) {
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      onChange();
    });
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [ATRIBUTO_DO_TOUR_ATIVO, "data-scroll-locked", "data-liz-hide"],
  });
  document.addEventListener("fullscreenchange", schedule);
  return () => {
    observer.disconnect();
    document.removeEventListener("fullscreenchange", schedule);
    if (frame) cancelAnimationFrame(frame);
  };
}

function obterFotoAtual(): boolean {
  const body = document.body;
  const tour = body.getAttribute(ATRIBUTO_DO_TOUR_ATIVO);
  if (tour !== null && tour !== "false" && tour !== "0") return true;
  if (body.hasAttribute("data-scroll-locked")) return true;
  if (document.fullscreenElement) return true;
  return document.querySelector(`${SELETOR_DE_MODAL}, [data-liz-hide]`) !== null;
}

export function useLizEscondida(): boolean {
  return useSyncExternalStore(assinarMudancas, obterFotoAtual, () => false);
}
