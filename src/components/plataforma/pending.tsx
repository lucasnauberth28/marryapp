"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ehCliqueSimplesComBotaoEsquerdo, destinoDaNavegacao } from "@/lib/painel/navigation-progress";
import { listaEstaPendente, chaveDaLocalizacao } from "@/lib/platform/pending-nav";
import { cn } from "@/lib/utils";

/*
 * Lista "atualizando" ao trocar filtro, aba ou página (tudo por URL, resolvido no servidor).
 * O Next mantém a tela antiga até a nova chegar; em vez de piscar uma tela vazia, a lista fica mais clara
 * (com aria-busy) até a URL chegar no destino. Quem dispara: FilterBar (markListNavigation) e os links de
 * TabsNav/Pagination/FilterChips (PendingLink). Quem mostra: PendingRegion, em volta do que muda.
 *   <PendingRegion> <ResponsiveTable …/> <Pagination …/> </PendingRegion>
 * A rota nova com o seu loading.tsx não passa por aqui: o destino precisa ser a MESMA página (ver pending-nav.ts).
 */

const LIMITE_DE_SEGURANCA_EM_MS = 10_000;
let destinoPendente: string | null = null;
let temporizadorDeSegurancaDaLista: ReturnType<typeof setTimeout> | undefined;
const ouvintes = new Set<() => void>();

function emitirMudanca() {
  ouvintes.forEach((l) => l());
}

/** Marca que a URL vai mudar para `href` (mesma página). Sem efeito para endereço de outro site. */
export function marcarNavegacaoDaLista(href: string) {
  const key = chaveDaLocalizacao(href);
  if (!key) return;
  destinoPendente = key;
  clearTimeout(temporizadorDeSegurancaDaLista);
  // Rede ou servidor falhou e a URL nunca chegou: não deixa a lista clara para sempre.
  temporizadorDeSegurancaDaLista = setTimeout(() => {
    destinoPendente = null;
    emitirMudanca();
  }, LIMITE_DE_SEGURANCA_EM_MS);
  emitirMudanca();
}

function assinarMudancas(listener: () => void) {
  ouvintes.add(listener);
  return () => {
    ouvintes.delete(listener);
  };
}

const obterDestino = () => destinoPendente;
const obterDestinoNoServidor = () => null;

/** Encerra o pedido pendente quando a URL chegou ao destino ou o usuário já está em outra página. */
function liberarPendencia(pathname: string, search: string) {
  if (destinoPendente === null) return;
  const current = chaveDaLocalizacao(`${pathname}${search ? `?${search}` : ""}`);
  if (current === destinoPendente || destinoPendente.split("?")[0] !== pathname) {
    destinoPendente = null;
    clearTimeout(temporizadorDeSegurancaDaLista);
    emitirMudanca();
  }
}

/** true enquanto a mesma página troca de filtro, aba ou página. */
function useListaPendente(): boolean {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const pendingTarget = useSyncExternalStore(assinarMudancas, obterDestino, obterDestinoNoServidor);
  useEffect(() => {
    liberarPendencia(pathname, search);
  }, [pathname, search]);
  return listaEstaPendente(pendingTarget, pathname, search);
}

/**
 * Link de navegação de lista (aba, página, chip de filtro). Igual ao Link do Next, e avisa a PendingRegion
 * no clique simples. Abrir em nova aba (Ctrl/Cmd) e links para outra página não marcam nada.
 */
export function LinkPendente({ onClick, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || !ehCliqueSimplesComBotaoEsquerdo(e)) return;
        const a = e.currentTarget;
        const to = destinoDaNavegacao({ href: a.href, target: a.getAttribute("target"), download: a.hasAttribute("download"), optOut: a.hasAttribute("data-no-progress") }, window.location.href);
        if (to) marcarNavegacaoDaLista(to);
      }}
    />
  );
}

/**
 * Envolve o que muda com o filtro: enquanto a URL não chega, fica mais clara e marcada como ocupada.
 * O efeito só começa depois de 200ms (navegação rápida não pisca) e some na hora quando termina.
 */
export function RegiaoPendente({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  const pending = useListaPendente();
  return (
    <div id={id} aria-busy={pending || undefined} className={cn("transition-opacity duration-150", pending && "opacity-60 delay-200", className)}>
      <span role="status" className="sr-only">
        {pending ? "Atualizando a lista..." : ""}
      </span>
      {children}
    </div>
  );
}
