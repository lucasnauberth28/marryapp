"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isPlainLeftClick, navigationTarget } from "@/lib/navigation-progress";
import { isListPending, locationKey } from "@/lib/platform/pending-nav";
import { cn } from "@/lib/utils";

/*
 * Lista "atualizando" ao trocar filtro, aba ou página (tudo por URL, resolvido no servidor).
 * O Next mantém a tela antiga até a nova chegar; em vez de piscar uma tela vazia, a lista fica mais clara
 * (com aria-busy) até a URL chegar no destino. Quem dispara: FilterBar (markListNavigation) e os links de
 * TabsNav/Pagination/FilterChips (PendingLink). Quem mostra: PendingRegion, em volta do que muda.
 *   <PendingRegion> <ResponsiveTable …/> <Pagination …/> </PendingRegion>
 * A rota nova com o seu loading.tsx não passa por aqui: o destino precisa ser a MESMA página (ver pending-nav.ts).
 */

const SAFETY_MS = 10_000;
let target: string | null = null;
let safety: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Marca que a URL vai mudar para `href` (mesma página). Sem efeito para endereço de outro site. */
export function markListNavigation(href: string) {
  const key = locationKey(href);
  if (!key) return;
  target = key;
  clearTimeout(safety);
  // Rede ou servidor falhou e a URL nunca chegou: não deixa a lista clara para sempre.
  safety = setTimeout(() => {
    target = null;
    emit();
  }, SAFETY_MS);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getTarget = () => target;
const getServerTarget = () => null;

/** Encerra o pedido pendente quando a URL chegou ao destino ou o usuário já está em outra página. */
function settle(pathname: string, search: string) {
  if (target === null) return;
  const current = locationKey(`${pathname}${search ? `?${search}` : ""}`);
  if (current === target || target.split("?")[0] !== pathname) {
    target = null;
    clearTimeout(safety);
    emit();
  }
}

/** true enquanto a mesma página troca de filtro, aba ou página. */
export function useListPending(): boolean {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const pendingTarget = useSyncExternalStore(subscribe, getTarget, getServerTarget);
  useEffect(() => {
    settle(pathname, search);
  }, [pathname, search]);
  return isListPending(pendingTarget, pathname, search);
}

/**
 * Link de navegação de lista (aba, página, chip de filtro). Igual ao Link do Next, e avisa a PendingRegion
 * no clique simples. Abrir em nova aba (Ctrl/Cmd) e links para outra página não marcam nada.
 */
export function PendingLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || !isPlainLeftClick(e)) return;
        const a = e.currentTarget;
        const to = navigationTarget({ href: a.href, target: a.getAttribute("target"), download: a.hasAttribute("download"), optOut: a.hasAttribute("data-no-progress") }, window.location.href);
        if (to) markListNavigation(to);
      }}
    />
  );
}

/**
 * Envolve o que muda com o filtro: enquanto a URL não chega, fica mais clara e marcada como ocupada.
 * O efeito só começa depois de 200ms (navegação rápida não pisca) e some na hora quando termina.
 */
export function PendingRegion({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  const pending = useListPending();
  return (
    <div id={id} aria-busy={pending || undefined} className={cn("transition-opacity duration-150", pending && "opacity-60 delay-200", className)}>
      <span role="status" className="sr-only">
        {pending ? "Atualizando a lista..." : ""}
      </span>
      {children}
    </div>
  );
}
