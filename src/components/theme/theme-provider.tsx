"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  THEME_KEY,
  parseThemePreference,
  readThemeFromCookie,
  resolveTheme,
  serializeThemeCookie,
  type AppliedTheme,
  type ThemePreference,
} from "@/lib/theme";

// Cor da barra do navegador (meta theme-color) por tema: é o `linho` de cada paleta.
const THEME_COLOR: Record<AppliedTheme, string> = { light: "#F7F3EC", dark: "#18131A" };
const DARK_QUERY = "(prefers-color-scheme: dark)";

type ThemeContextValue = {
  /** O que a pessoa escolheu: "light", "dark" ou "system" (Do aparelho). */
  preference: ThemePreference;
  /** O tema que está no <html> agora (já considera o sistema e as páginas sempre claras). */
  resolvedTheme: AppliedTheme;
  setPreference: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const LockContext = createContext<((on: boolean) => void) | null>(null);

// Preferência guardada: cookie primeiro, localStorage de reserva. O "snapshot" é uma string estável.
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function readStoredPreference(): ThemePreference {
  const fromCookie = readThemeFromCookie(document.cookie);
  if (fromCookie) return fromCookie;
  try {
    return parseThemePreference(localStorage.getItem(THEME_KEY));
  } catch {
    return "light";
  }
}

function subscribePreference(onChange: () => void) {
  listeners.add(onChange);
  // Outra aba gravou no localStorage (o cookie acompanha a gravação).
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY || e.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function subscribeSystem(onChange: () => void) {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const noopSubscribe = () => () => {};

/**
 * Guarda a escolha de tema e aplica data-theme no <html>. O primeiro valor vem do script inline do
 * <head> (THEME_INIT_SCRIPT), antes da pintura; aqui só reagimos a mudanças: troca ao vivo, mudança
 * do sistema quando a opção é "Do aparelho", navegação entre páginas sempre claras e as demais.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Na hidratação o servidor devolve o padrão (claro); só depois de montar valem os valores do navegador.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const preference = useSyncExternalStore(subscribePreference, readStoredPreference, () => "light" as const);
  const systemDark = useSyncExternalStore(subscribeSystem, () => window.matchMedia(DARK_QUERY).matches, () => false);
  const [locks, setLocks] = useState(0);

  const resolvedTheme: AppliedTheme = locks > 0 ? "light" : resolveTheme({ preference, systemDark, pathname });

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", THEME_COLOR[resolvedTheme]));
  }, [mounted, resolvedTheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    document.cookie = serializeThemeCookie(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* navegação privativa: o cookie já guarda */
    }
    emit();
  }, []);

  const registerLock = useCallback((on: boolean) => setLocks((n) => Math.max(0, n + (on ? 1 : -1))), []);

  const value = useMemo(() => ({ preference, resolvedTheme, setPreference }), [preference, resolvedTheme, setPreference]);

  return (
    <LockContext.Provider value={registerLock}>
      <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    </LockContext.Provider>
  );
}

/** Tema atual e como trocá-lo. Fora do provider devolve o padrão ("Claro") e não faz nada. */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext) ?? { preference: "light", resolvedTheme: "light", setPreference: () => {} };
}

/**
 * Trava o <html> em claro enquanto estiver montado (sem mexer na escolha guardada) e desenha o
 * escopo data-theme="light" ao redor dos filhos. Para páginas que ficam sempre claras mesmo em
 * endereço próprio do casal, onde o caminho (/) não identifica a rota.
 */
export function ThemeLight({ children, className }: { children: React.ReactNode; className?: string }) {
  const register = useContext(LockContext);
  useEffect(() => {
    register?.(true);
    return () => register?.(false);
  }, [register]);
  return (
    <div data-theme="light" className={className}>
      {children}
    </div>
  );
}
