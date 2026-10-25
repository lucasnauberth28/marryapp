"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  CHAVE_DO_TEMA,
  interpretarPreferenciaDeTema,
  lerTemaDoCookie,
  resolverTema,
  serializarCookieDoTema,
  type TemaAplicado,
  type PreferenciaDeTema,
} from "@/lib/theme";

// Cor da barra do navegador (meta theme-color) por tema: é o `linho` de cada paleta.
const COR_DO_TEMA: Record<TemaAplicado, string> = { light: "#FCFBFA", dark: "#141113" };
const CONSULTA_DO_TEMA_ESCURO = "(prefers-color-scheme: dark)";

type ValorDoContextoDoTema = {
  /** O que a pessoa escolheu: "light", "dark" ou "system" (Do aparelho). */
  preference: PreferenciaDeTema;
  /** O tema que está no <html> agora (já considera o sistema e as páginas sempre claras). */
  resolvedTheme: TemaAplicado;
  setPreference: (next: PreferenciaDeTema) => void;
};

const ContextoDoTema = createContext<ValorDoContextoDoTema | null>(null);
const ContextoDeTravaDoTema = createContext<((on: boolean) => void) | null>(null);

// Preferência guardada: cookie primeiro, localStorage de reserva. O "snapshot" é uma string estável.
const ouvintesDoProgresso = new Set<() => void>();
const emitirMudancaDoTema = () => ouvintesDoProgresso.forEach((l) => l());

function lerPreferenciaGuardada(): PreferenciaDeTema {
  const fromCookie = lerTemaDoCookie(document.cookie);
  if (fromCookie) return fromCookie;
  try {
    return interpretarPreferenciaDeTema(localStorage.getItem(CHAVE_DO_TEMA));
  } catch {
    return "light";
  }
}

function assinarPreferencia(onChange: () => void) {
  ouvintesDoProgresso.add(onChange);
  // Outra aba gravou no localStorage (o cookie acompanha a gravação).
  const onStorage = (e: StorageEvent) => {
    if (e.key === CHAVE_DO_TEMA || e.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    ouvintesDoProgresso.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function assinarSistema(onChange: () => void) {
  const mq = window.matchMedia(CONSULTA_DO_TEMA_ESCURO);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const assinaturaVazia = () => () => {};

/**
 * Guarda a escolha de tema e aplica data-theme no <html>. O primeiro valor vem do script inline do
 * <head> (THEME_INIT_SCRIPT), antes da pintura; aqui só reagimos a mudanças: troca ao vivo, mudança
 * do sistema quando a opção é "Do aparelho", navegação entre páginas sempre claras e as demais.
 */
export function ProvedorDoTema({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Na hidratação o servidor devolve o padrão (claro); só depois de montar valem os valores do navegador.
  const mounted = useSyncExternalStore(assinaturaVazia, () => true, () => false);
  const preference = useSyncExternalStore(assinarPreferencia, lerPreferenciaGuardada, () => "light" as const);
  const systemDark = useSyncExternalStore(assinarSistema, () => window.matchMedia(CONSULTA_DO_TEMA_ESCURO).matches, () => false);
  const [locks, setLocks] = useState(0);

  const resolvedTheme: TemaAplicado = locks > 0 ? "light" : resolverTema({ preference, systemDark, pathname });

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", COR_DO_TEMA[resolvedTheme]));
  }, [mounted, resolvedTheme]);

  const setPreference = useCallback((next: PreferenciaDeTema) => {
    document.cookie = serializarCookieDoTema(next);
    try {
      localStorage.setItem(CHAVE_DO_TEMA, next);
    } catch {
      /* navegação privativa: o cookie já guarda */
    }
    emitirMudancaDoTema();
  }, []);

  const registerLock = useCallback((on: boolean) => setLocks((n) => Math.max(0, n + (on ? 1 : -1))), []);

  const value = useMemo(() => ({ preference, resolvedTheme, setPreference }), [preference, resolvedTheme, setPreference]);

  return (
    <ContextoDeTravaDoTema.Provider value={registerLock}>
      <ContextoDoTema.Provider value={value}>{children}</ContextoDoTema.Provider>
    </ContextoDeTravaDoTema.Provider>
  );
}

/** Tema atual e como trocá-lo. Fora do provider devolve o padrão ("Claro") e não faz nada. */
export function useTema(): ValorDoContextoDoTema {
  return useContext(ContextoDoTema) ?? { preference: "light", resolvedTheme: "light", setPreference: () => {} };
}

/**
 * Trava o <html> em claro enquanto estiver montado (sem mexer na escolha guardada) e desenha o
 * escopo data-theme="light" ao redor dos filhos. Para páginas que ficam sempre claras mesmo em
 * endereço próprio do casal, onde o caminho (/) não identifica a rota.
 */
export function TemaClaro({ children, className }: { children: React.ReactNode; className?: string }) {
  const register = useContext(ContextoDeTravaDoTema);
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
