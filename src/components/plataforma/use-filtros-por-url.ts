"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { iniciarProgressoDaNavegacao } from "@/components/feedback/navigation-progress";
import { marcarNavegacaoDaLista } from "@/components/plataforma/pending";

/** Busca (com espera de 300 ms) e filtros que moram na URL; zera `?pagina` e mantém a aba ao limpar. */
export function useFiltrosPorUrl(searchKey: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlSearch = searchParams.get(searchKey) ?? "";
  const [text, setText] = useState(urlSearch);
  const [seenUrl, setSeenUrl] = useState(urlSearch);
  // Voltar do navegador ou "Limpar filtros" muda a URL: o campo acompanha (ajuste durante a renderização, sem efeito)
  if (urlSearch !== seenUrl) {
    setSeenUrl(urlSearch);
    setText(urlSearch);
  }

  const push = (next: URLSearchParams) => {
    next.delete("pagina");
    const qs = next.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;
    // Mesma URL (mesmo filtro escolhido de novo): nada a buscar
    if (qs === searchParams.toString()) return;
    iniciarProgressoDaNavegacao();
    marcarNavegacaoDaLista(href); // a lista (PendingRegion) fica mais clara até chegar
    startTransition(() => router.replace(href, { scroll: false }));
  };

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    push(next);
  };

  const onSearch = (value: string) => {
    setText(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setParam(searchKey, value.trim()), 300);
  };

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    const next = new URLSearchParams();
    const tab = searchParams.get("aba");
    if (tab) next.set("aba", tab);
    setText("");
    push(next);
  };

  return { pending, text, urlSearch, searchParams, setParam, onSearch, clear };
}
