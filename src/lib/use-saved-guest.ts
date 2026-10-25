"use client";

import { useCallback, useSyncExternalStore } from "react";
import { interpretarConvidadoSalvo, chaveDoConvidadoSalvo, serializarConvidadoSalvo, type ConvidadoSalvo } from "./saved-guest";

const ouvintes = new Set<() => void>();

function assinarMudancas(listener: () => void) {
  ouvintes.add(listener);
  return () => {
    ouvintes.delete(listener);
  };
}

function lerConvidadoSalvo(slug: string): string | null {
  try {
    return window.sessionStorage.getItem(chaveDoConvidadoSalvo(slug));
  } catch {
    // Armazenamento bloqueado (aba privada, política do navegador): segue sem reaproveitar nada.
    return null;
  }
}

/** Grava quem se identificou na confirmação de presença (chamado depois que a pessoa respondeu). */
export function lembrarConvidado(slug: string, guest: ConvidadoSalvo) {
  const raw = serializarConvidadoSalvo(guest);
  if (!raw) return;
  try {
    window.sessionStorage.setItem(chaveDoConvidadoSalvo(slug), raw);
  } catch {
    // sem armazenamento: o checkout só pede os dados de novo
  }
  ouvintes.forEach((l) => l());
}

function esquecerConvidado(slug: string) {
  try {
    window.sessionStorage.removeItem(chaveDoConvidadoSalvo(slug));
  } catch {
    // nada a limpar
  }
  ouvintes.forEach((l) => l());
}

/** Quem se identificou neste navegador no site deste casamento, ou null. No servidor é sempre null. */
export function useConvidadoSalvo(slug: string): { guest: ConvidadoSalvo | null; forget: () => void } {
  const raw = useSyncExternalStore(
    assinarMudancas,
    () => lerConvidadoSalvo(slug),
    () => null,
  );
  const forget = useCallback(() => esquecerConvidado(slug), [slug]);
  return { guest: interpretarConvidadoSalvo(raw), forget };
}
