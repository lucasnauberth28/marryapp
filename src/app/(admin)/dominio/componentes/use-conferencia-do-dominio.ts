// Confere se o nome do endereço está livre, depois de uma pausa na digitação (ou na hora, ao escolher uma sugestão).
import { useEffect, useRef, useState } from "react";
import { verificarDisponibilidadeDoDominioAcao } from "@/actions/domain-actions";
import { normalizarNomeDeDominio } from "@/lib/domain-name";
import type { ConferenciaDeDominio } from "./tipos";

export function useConferenciaDoDominio() {
  const [check, setCheck] = useState<ConferenciaDeDominio>({ state: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequence = useRef(0);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function agendar(value: string, immediately = false) {
    if (timer.current) clearTimeout(timer.current);
    const mine = ++sequence.current;
    const parsed = normalizarNomeDeDominio(value);
    if (!parsed.ok) return setCheck(value.trim() ? { state: "invalid", message: parsed.error } : { state: "idle" });
    setCheck({ state: "checking" });
    timer.current = setTimeout(async () => {
      const result = await verificarDisponibilidadeDoDominioAcao({ domain: parsed.domain });
      if (mine !== sequence.current) return;
      setCheck(result.success ? { state: result.availability, domain: result.domain } : { state: "error", message: result.error });
    }, immediately ? 0 : 600);
  }

  return { check, agendar };
}
