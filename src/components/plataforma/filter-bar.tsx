"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { btn } from "@/components/landing/styles";
import { startNavigationProgress } from "@/components/feedback/navigation-progress";
import { markListNavigation } from "@/components/plataforma/pending";
import { cn } from "@/lib/utils";

/**
 * Barra de busca e filtros por URL, para listas de servidor (casais, fornecedores, domínios...).
 *   <FilterBar
 *     searchPlaceholder="Buscar por nome, e-mail, telefone ou endereço do site"
 *     filters={[{ key: "plano", label: "Plano", allLabel: "Todos", options: [{ value: "classic", label: "Classic" }] }]}
 *   />
 * - Escreve na URL: ?q=texto&plano=classic (a busca espera 300 ms depois de digitar) e zera ?pagina.
 * - A página (servidor) lê os mesmos nomes com lib/platform/list-params (param, oneOf).
 * - Campos de rótulo flutuante (NativeSelect com alwaysFloat): o rótulo fica no alto e a opção sem valor mostra `allLabel`.
 * - Enquanto a URL muda, a lista dentro de <PendingRegion> fica mais clara (sem piscar tela vazia).
 * - "Limpar filtros" aparece quando há busca ou filtro ativo e mantém a aba (?aba=).
 * - searchKey (padrão "q"); defina searchPlaceholder = undefined para esconder a busca.
 */
export interface FilterDef {
  key: string;
  label: string;
  /** Texto da opção sem valor ("Todos", "Qualquer data", "Tanto faz"). */
  allLabel: string;
  options: { value: string; label: string }[];
}

export function FilterBar({
  filters = [],
  searchPlaceholder,
  searchKey = "q",
  searchLabel,
  className,
}: {
  filters?: FilterDef[];
  searchPlaceholder?: string;
  searchKey?: string;
  /** Nome acessível da busca (padrão: o próprio placeholder). */
  searchLabel?: string;
  className?: string;
}) {
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
    startNavigationProgress();
    markListNavigation(href); // a lista (PendingRegion) fica mais clara até chegar
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

  const active = Boolean(urlSearch) || filters.some((f) => searchParams.get(f.key));
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    const next = new URLSearchParams();
    const tab = searchParams.get("aba");
    if (tab) next.set("aba", tab);
    setText("");
    push(next);
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} aria-busy={pending}>
      {searchPlaceholder && (
        <div className="relative max-w-[560px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-tinta-suave" strokeWidth={1.75} aria-hidden="true" />
          <Input
            type="search"
            value={text}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchLabel ?? searchPlaceholder}
            maxLength={100}
            className="h-12 pl-12"
          />
        </div>
      )}
      {filters.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
          {filters.map((f) => (
            <NativeSelect
              key={f.key}
              label={f.label}
              alwaysFloat
              value={searchParams.get(f.key) ?? ""}
              onChange={(e) => setParam(f.key, e.target.value)}
            >
              <option value="">{f.allLabel}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          ))}
        </div>
      )}
      {active && (
        <div>
          <button type="button" onClick={clear} className={cn(btn.secondary, btn.sm, "gap-1.5")}>
            <X className="size-4" aria-hidden="true" /> Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
