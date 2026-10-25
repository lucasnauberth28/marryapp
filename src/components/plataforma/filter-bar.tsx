"use client";

import { Search, X } from "lucide-react";
import { Entrada } from "@/components/ui/input";
import { SelecaoNativa } from "@/components/ui/select";
import { estiloDoBotao } from "@/components/landing/styles";
import { cn } from "@/lib/utils";
import { useFiltrosPorUrl } from "./use-filtros-por-url";

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
export interface DefinicaoDoFiltro {
  key: string;
  label: string;
  /** Texto da opção sem valor ("Todos", "Qualquer data", "Tanto faz"). */
  allLabel: string;
  options: { value: string; label: string }[];
}

interface Propriedades {
  filters?: DefinicaoDoFiltro[];
  searchPlaceholder?: string;
  searchKey?: string;
  /** Nome acessível da busca (padrão: o próprio placeholder). */
  searchLabel?: string;
  className?: string;
}

export function BarraDeFiltros({ filters = [], searchPlaceholder, searchKey = "q", searchLabel, className }: Propriedades) {
  const { pending, text, urlSearch, searchParams, setParam, onSearch, clear } = useFiltrosPorUrl(searchKey);
  const active = Boolean(urlSearch) || filters.some((f) => searchParams.get(f.key));

  return (
    <div className={cn("flex flex-col gap-4", className)} aria-busy={pending}>
      {searchPlaceholder && (
        <div className="relative max-w-[560px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-tinta-suave" strokeWidth={1.6} aria-hidden="true" />
          <Entrada
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
            <SelecaoNativa key={f.key} label={f.label} alwaysFloat value={searchParams.get(f.key) ?? ""} onChange={(e) => setParam(f.key, e.target.value)}>
              <option value="">{f.allLabel}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelecaoNativa>
          ))}
        </div>
      )}
      {active && (
        <div>
          <button type="button" onClick={clear} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm, "gap-1.5")}>
            <X className="size-4" aria-hidden="true" /> Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
