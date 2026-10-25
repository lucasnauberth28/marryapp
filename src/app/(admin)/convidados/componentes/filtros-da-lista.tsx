import { Check, Clock, Search, X } from "lucide-react";
import { estiloDaEntradaDoPainel } from "@/components/painel/styles";
import type { FiltroDaLista } from "./tipos";
import type { ListaDeConvidados } from "./use-lista-de-convidados";

const FILTROS: Array<{ value: FiltroDaLista; label: string; tone: string; icon?: React.ReactNode }> = [
  { value: "all", label: "Todos", tone: "bg-areia text-tinta" },
  { value: "CONFIRMED", label: "Confirmados", tone: "bg-sucesso-suave text-sucesso", icon: <Check className="size-4" aria-hidden="true" /> },
  { value: "PENDING", label: "Sem resposta", tone: "bg-aviso-suave text-aviso", icon: <Clock className="size-4" aria-hidden="true" /> },
  { value: "DECLINED", label: "Não vão", tone: "bg-perigo-suave text-perigo", icon: <X className="size-4" aria-hidden="true" /> },
];

export function FiltrosDaLista({ lista }: { lista: ListaDeConvidados }) {
  return (
    <>
      <div role="group" aria-label="Filtrar por resposta" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
        {FILTROS.map((c) => {
          const ativo = lista.filtro === c.value;
          return (
            <button
              key={c.value}
              type="button"
              aria-pressed={ativo}
              onClick={() => lista.mudarFiltro(c.value)}
              className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-colors md:min-h-10 ${
                ativo ? "bg-ameixa text-on-ameixa" : `${c.tone} hover:brightness-95`
              }`}
            >
              {!ativo && c.icon}
              {c.label} · {lista.contagens[c.value]}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tinta-suave" aria-hidden="true" />
          <input type="search" aria-label="Buscar convidado" placeholder="Buscar por nome ou telefone" value={lista.busca} onChange={(e) => lista.mudarBusca(e.target.value)} className={`${estiloDaEntradaDoPainel} pl-10`} />
        </div>
        <select aria-label="Grupo" value={lista.grupo} onChange={(e) => lista.mudarGrupo(e.target.value)} className={`${estiloDaEntradaDoPainel} sm:w-52 sm:flex-none`}>
          <option value="">Todos os grupos</option>
          {lista.grupos.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
