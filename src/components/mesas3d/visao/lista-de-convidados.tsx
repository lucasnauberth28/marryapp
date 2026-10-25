import { cn } from "@/lib/utils";
import type { PosicaoDaMesa } from "@/lib/mesas3d/layout";
import { corDoConvidado, type ConvidadoParaSentar, type gruposDe } from "@/lib/mesas3d/seating";
import { iniciaisDoNome, type ArrastoEmAndamento } from "./tipos";
import { convidadosDaLista } from "./use-acoes";
import type { DadosDasMesas } from "./use-dados-das-mesas";
import type { EstadoDaVisao } from "./use-estado";

type Grupos = ReturnType<typeof gruposDe>;

function EtiquetaDeFiltro({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn("min-h-8 cursor-pointer rounded-full border px-3 text-[13px]", pressed ? "border-ameixa bg-ameixa-suave font-semibold text-ameixa" : "border-linha bg-papel text-tinta-suave hover:text-tinta")}
    >
      {children}
    </button>
  );
}

interface PropriedadesDoResumo {
  seatedSeats: number;
  totalSeats: number;
  unseated: number;
  filter: "sem" | "todos";
  aoFiltrar: (f: "sem" | "todos") => void;
}

function ResumoDeLugares({ seatedSeats, totalSeats, unseated, filter, aoFiltrar }: PropriedadesDoResumo) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <p className="text-[15px] leading-5 text-tinta">
          <strong className="tabular-nums">{seatedSeats}</strong> de <span className="tabular-nums">{totalSeats}</span> lugares com mesa
        </p>
        <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full border border-linha bg-areia">
          <div className="h-full bg-ameixa transition-[width] duration-200" style={{ width: `${totalSeats ? (seatedSeats / totalSeats) * 100 : 0}%` }} />
        </div>
      </div>
      <div role="group" aria-label="Filtro da lista" className="flex flex-wrap gap-1.5">
        <EtiquetaDeFiltro pressed={filter === "sem"} onClick={() => aoFiltrar("sem")}>
          Sem mesa <span className="tabular-nums">{unseated}</span>
        </EtiquetaDeFiltro>
        <EtiquetaDeFiltro pressed={filter === "todos"} onClick={() => aoFiltrar("todos")}>
          Todos
        </EtiquetaDeFiltro>
      </div>
    </>
  );
}

interface PropriedadesDoItem {
  g: ConvidadoParaSentar;
  edit: boolean;
  selected: boolean;
  slot: PosicaoDaMesa | null | undefined;
  groups: Grupos;
  opcoesDeMesa: PosicaoDaMesa[];
  dragRef: React.MutableRefObject<ArrastoEmAndamento | null>;
  suppressClickRef: React.MutableRefObject<boolean>;
  aoClicar: () => void;
  aoMover: (tableId: string | null) => void;
}

function ItemDoConvidado({ g, edit, selected, slot, groups, opcoesDeMesa, dragRef, suppressClickRef, aoClicar, aoMover }: PropriedadesDoItem) {
  return (
    <li
      data-selected={selected || undefined}
      onPointerDown={(e) => {
        if (!edit || e.pointerType === "touch" || e.button !== 0 || (e.target as HTMLElement).closest("select")) return;
        dragRef.current = { guest: g, x: e.clientX, y: e.clientY, live: false };
      }}
      className={cn(
        "grid grid-cols-[32px_1fr_auto] items-center gap-x-2.5 gap-y-1.5 rounded-xl border px-2.5 py-2 text-left",
        edit && "cursor-grab touch-pan-y select-none",
        selected ? "border-ameixa bg-ameixa-suave" : "border-linha bg-papel hover:border-ameixa",
      )}
    >
      <span aria-hidden="true" className="grid size-8 place-items-center rounded-full text-xs font-semibold text-white" style={{ background: corDoConvidado(groups, g) }}>
        {iniciaisDoNome(g.name)}
      </span>
      <button
        type="button"
        onClick={() => {
          if (!suppressClickRef.current) aoClicar();
        }}
        className="min-w-0 cursor-pointer text-left"
      >
        <span className="block truncate text-[15px] font-medium leading-5 text-tinta">{g.name}</span>
        <span className="block truncate text-xs leading-4 text-tinta-suave">
          {g.category ?? "Sem grupo"}
          {g.seats > 1 ? ` · ${g.seats} lugares` : ""}
        </span>
      </button>
      <span className={cn("max-w-[7rem] truncate rounded-full px-2.5 py-0.5 text-xs font-semibold", slot ? "bg-ameixa-suave text-ameixa" : "bg-aviso-suave text-aviso")}>{slot ? slot.nome : "Sem mesa"}</span>
      {edit ? (
        <select
          aria-label={`Mover ${g.name} para`}
          value={g.tableId ?? ""}
          onChange={(e) => aoMover(e.target.value || null)}
          className={cn("col-span-2 col-start-2 min-h-9 rounded-lg border border-linha-forte bg-papel px-2 text-sm text-tinta", selected ? "block" : "sr-only focus:not-sr-only focus:block")}
        >
          <option value="">Sem mesa</option>
          {opcoesDeMesa.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
      ) : null}
    </li>
  );
}

function textoDeListaVazia(edit: boolean, temConvidados: boolean, busca: string) {
  if (!edit) return busca ? "Nenhum convidado com esse nome." : "Digite seu nome para ver onde sentar.";
  if (!temConvidados) return "Ainda não há convidados confirmados.";
  return busca ? "Nenhum convidado com esse nome." : "Todos os convidados já têm mesa.";
}

export interface PropriedadesDaLista {
  edit: boolean;
  estado: EstadoDaVisao;
  dados: DadosDasMesas;
  dragRef: React.MutableRefObject<ArrastoEmAndamento | null>;
  suppressClickRef: React.MutableRefObject<boolean>;
  aoEscolher: (g: ConvidadoParaSentar) => void;
  aoSentar: (g: ConvidadoParaSentar, tableId: string | null) => void;
}

export function ListaDeConvidados(p: PropriedadesDaLista) {
  const { edit, estado: e } = p;
  const { groups, slotsById, layout } = p.dados;
  const { guests, query } = e;
  const list = convidadosDaLista(edit, guests, e.filter, query.trim());
  const seatedSeats = guests.reduce((n, g) => n + (g.tableId ? g.seats : 0), 0);
  const totalSeats = guests.reduce((n, g) => n + g.seats, 0);
  const unseated = guests.filter((g) => !g.tableId).length;
  const opcoesDeMesa = layout.slots.filter((s) => !s.decor);
  const rotulo = edit ? "Buscar convidado" : "Digite seu nome";

  return (
    <aside aria-label="Convidados" className="order-2 flex min-h-0 max-h-[60vh] flex-col gap-3 rounded-2xl border border-linha bg-papel p-4 lg:order-1 lg:max-h-none">
      {edit ? <ResumoDeLugares seatedSeats={seatedSeats} totalSeats={totalSeats} unseated={unseated} filter={e.filter} aoFiltrar={e.setFilter} /> : <p className="text-[15px] font-semibold leading-5 text-tinta">Encontre a sua mesa</p>}
      <input type="search" value={query} onChange={(ev) => e.setQuery(ev.target.value)} placeholder={rotulo} aria-label={rotulo} autoComplete="off" className="min-h-11 w-full rounded-xl border border-linha-forte bg-papel px-4 text-base text-tinta placeholder:text-tinta-suave" />
      <ul aria-label="Lista de convidados" className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto">
        {list.length === 0 ? (
          <li className="px-1 py-3 text-sm leading-5 text-tinta-suave">{textoDeListaVazia(edit, guests.length > 0, query.trim())}</li>
        ) : (
          list.map((g) => (
            <ItemDoConvidado
              key={g.id}
              g={g}
              edit={edit}
              selected={e.selectedId === g.id}
              slot={g.tableId ? slotsById.get(g.tableId) : null}
              groups={groups}
              opcoesDeMesa={opcoesDeMesa}
              dragRef={p.dragRef}
              suppressClickRef={p.suppressClickRef}
              aoClicar={() => p.aoEscolher(g)}
              aoMover={(tableId) => p.aoSentar(g, tableId)}
            />
          ))
        )}
      </ul>
      {edit && groups.length > 0 ? (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-tinta-suave" aria-label="Cores dos grupos nas cadeiras">
          {groups.map((gr) => (
            <li key={gr.key} className="flex items-center gap-1.5">
              <i aria-hidden="true" className="inline-block size-2.5 rounded-full" style={{ background: gr.color }} />
              {gr.label}
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}
