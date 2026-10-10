"use client";

import { useEffect, useState } from "react";

/**
 * Relógio que anda de minuto em minuto, para os "há 5 min" não ficarem parados.
 * `initialIso` (vindo do servidor) mantém a primeira pintura igual no servidor e no navegador.
 */
export function useNow(initialIso?: string): Date {
  const [now, setNow] = useState(() => (initialIso ? new Date(initialIso) : new Date()));
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
