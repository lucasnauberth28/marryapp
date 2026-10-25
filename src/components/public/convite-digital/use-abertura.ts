import { useEffect, useState } from "react";

export type FaseDoConvite = "fechado" | "abrindo" | "aberto";

const DURACAO_DA_ABERTURA_EM_MS = 1500;

/** O envelope fechado, a abertura (aba, selo e saída) e a carta. Com "reduzir movimento" ligado, vai direto à carta. */
export function useAbertura() {
  const [fase, setFase] = useState<FaseDoConvite>("fechado");

  useEffect(() => {
    if (fase !== "abrindo") return;
    const id = setTimeout(() => setFase("aberto"), DURACAO_DA_ABERTURA_EM_MS);
    return () => clearTimeout(id);
  }, [fase]);

  const abrir = () => {
    if (fase !== "fechado") return;
    setFase(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "aberto" : "abrindo");
  };

  return { fase, abrir };
}
