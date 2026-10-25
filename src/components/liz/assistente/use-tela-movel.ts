"use client";

import { useSyncExternalStore } from "react";

const CONSULTA_DE_TELA_MOVEL = "(max-width: 767px)";
const assinarTelaMovel = (cb: () => void) => {
  const mq = window.matchMedia(CONSULTA_DE_TELA_MOVEL);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const ehTelaMovelAgora = () => window.matchMedia(CONSULTA_DE_TELA_MOVEL).matches;

export function useTelaMovel() {
  return useSyncExternalStore(assinarTelaMovel, ehTelaMovelAgora, () => false);
}
