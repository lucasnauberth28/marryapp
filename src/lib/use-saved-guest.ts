"use client";

import { useCallback, useSyncExternalStore } from "react";
import { parseSavedGuest, savedGuestKey, serializeSavedGuest, type SavedGuest } from "./saved-guest";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function read(slug: string): string | null {
  try {
    return window.sessionStorage.getItem(savedGuestKey(slug));
  } catch {
    // Armazenamento bloqueado (aba privada, política do navegador): segue sem reaproveitar nada.
    return null;
  }
}

/** Grava quem se identificou na confirmação de presença (chamado depois que a pessoa respondeu). */
export function rememberGuest(slug: string, guest: SavedGuest) {
  const raw = serializeSavedGuest(guest);
  if (!raw) return;
  try {
    window.sessionStorage.setItem(savedGuestKey(slug), raw);
  } catch {
    // sem armazenamento: o checkout só pede os dados de novo
  }
  listeners.forEach((l) => l());
}

export function forgetGuest(slug: string) {
  try {
    window.sessionStorage.removeItem(savedGuestKey(slug));
  } catch {
    // nada a limpar
  }
  listeners.forEach((l) => l());
}

/** Quem se identificou neste navegador no site deste casamento, ou null. No servidor é sempre null. */
export function useSavedGuest(slug: string): { guest: SavedGuest | null; forget: () => void } {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(slug),
    () => null,
  );
  const forget = useCallback(() => forgetGuest(slug), [slug]);
  return { guest: parseSavedGuest(raw), forget };
}
