"use client";

import { Suspense, useEffect, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  TEMPO_DE_CONCLUSAO_EM_MS,
  PROGRESSO_PARADO,
  LIMITE_DE_SEGURANCA_EM_MS,
  ATRASO_PARA_MOSTRAR_EM_MS,
  INTERVALO_EM_MS,
  ehCliqueSimplesComBotaoEsquerdo,
  destinoDaNavegacao,
  redutorDoProgresso,
  type EventoDoProgresso,
  type EstadoDoProgresso,
} from "@/lib/navigation-progress";

/*
 * Fio de progresso no topo da tela em TODA troca de rota (painéis, /admin, páginas públicas).
 * Fica no layout raiz. Fluxo: clique num link interno -> start; a rota muda (usePathname/useSearchParams)
 * -> finish. Só aparece depois de 120ms, então navegação rápida não pisca. Com "reduzir movimento"
 * vira uma linha parada (ver navigation-progress.css).
 *
 * Por que não useLinkStatus: ele só funciona num componente DENTRO de cada <Link> (cada link teria de ser
 * trocado), e o guia do Next o indica para dica por link. Aqui um único ouvinte cobre todos os links.
 * Navegação por código (router.push/replace) não tem clique: chame startNavigationProgress() antes.
 * Link que não deve acender a barra: data-no-progress.
 */

let estadoDoProgresso: EstadoDoProgresso = PROGRESSO_PARADO;
const ouvintesDoProgresso = new Set<() => void>();
let temporizadorDeExibicao: ReturnType<typeof setTimeout> | undefined;
let temporizadorDeAvanco: ReturnType<typeof setInterval> | undefined;
let temporizadorDeSeguranca: ReturnType<typeof setTimeout> | undefined;
let temporizadorDeReinicio: ReturnType<typeof setTimeout> | undefined;

function despacharEvento(event: EventoDoProgresso) {
  const next = redutorDoProgresso(estadoDoProgresso, event);
  if (next === estadoDoProgresso) return;
  estadoDoProgresso = next;
  ouvintesDoProgresso.forEach((l) => l());
}

function faseAtual() {
  return estadoDoProgresso.phase;
}

function limparTemporizadores() {
  clearTimeout(temporizadorDeExibicao);
  clearInterval(temporizadorDeAvanco);
  clearTimeout(temporizadorDeSeguranca);
}

/** Acende a barra (sem efeito se já estiver acesa). Use antes de router.push/replace. */
export function iniciarProgressoDaNavegacao() {
  if (estadoDoProgresso.phase === "waiting" || estadoDoProgresso.phase === "loading") return;
  clearTimeout(temporizadorDeReinicio);
  despacharEvento("start");
  temporizadorDeExibicao = setTimeout(() => {
    despacharEvento("show");
    temporizadorDeAvanco = setInterval(() => despacharEvento("tick"), INTERVALO_EM_MS);
  }, ATRASO_PARA_MOSTRAR_EM_MS);
  temporizadorDeSeguranca = setTimeout(concluirProgressoDaNavegacao, LIMITE_DE_SEGURANCA_EM_MS);
}

/** Encerra a barra. O componente chama sozinho quando a rota muda. */
function concluirProgressoDaNavegacao() {
  if (estadoDoProgresso.phase === "idle" || estadoDoProgresso.phase === "done") return;
  limparTemporizadores();
  despacharEvento("finish");
  if (faseAtual() === "done") temporizadorDeReinicio = setTimeout(() => despacharEvento("reset"), TEMPO_DE_CONCLUSAO_EM_MS);
}

function assinarMudancas(listener: () => void) {
  ouvintesDoProgresso.add(listener);
  return () => {
    ouvintesDoProgresso.delete(listener);
  };
}

function BarraDeProgresso() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const current = useSyncExternalStore(assinarMudancas, () => estadoDoProgresso, () => PROGRESSO_PARADO);

  // A rota mudou: a navegação terminou.
  useEffect(() => {
    concluirProgressoDaNavegacao();
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ehCliqueSimplesComBotaoEsquerdo(e)) return;
      const anchor = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const to = destinoDaNavegacao(
        { href: anchor.href, target: anchor.getAttribute("target"), download: anchor.hasAttribute("download"), optOut: anchor.hasAttribute("data-no-progress") },
        window.location.href,
      );
      if (to) iniciarProgressoDaNavegacao();
    };
    const onPopState = () => iniciarProgressoDaNavegacao();
    // Captura: roda antes de qualquer stopPropagation de outro componente.
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  return (
    <div aria-hidden="true" data-phase={current.phase} className="ac-nav-progress">
      <div className="ac-nav-progress__bar" style={{ transform: `scaleX(${current.progress / 100})` }} />
    </div>
  );
}

/** Coloque uma vez no layout raiz. O Suspense existe porque useSearchParams exige (não pinta nada no fallback). */
export function ProgressoDaNavegacao() {
  return (
    <Suspense fallback={null}>
      <BarraDeProgresso />
    </Suspense>
  );
}
