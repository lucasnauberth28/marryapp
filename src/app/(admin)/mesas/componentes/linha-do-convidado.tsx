import { useDraggable } from "@dnd-kit/core";
import { ArrowRightLeft, GripVertical } from "lucide-react";
import { SEM_MESA, lugaresDe, type ConvidadoDaMesa, type MesaComConvidados } from "./tipos";

interface PropriedadesDaLinha {
  guest: ConvidadoDaMesa;
  tables: MesaComConvidados[];
  currentTableId: string | null;
  onMove: (guestId: string, to: string) => void;
}

function TrocaDeMesa({ guest, tables, currentTableId, onMove }: PropriedadesDaLinha) {
  return (
    <span className="relative grid size-11 shrink-0 place-items-center rounded-xl text-tinta-suave has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-[3px] has-[select:focus-visible]:outline-ameixa">
      <ArrowRightLeft className="size-4" aria-hidden="true" />
      <select
        aria-label={`Escolher a mesa de ${guest.name}`}
        value={currentTableId ?? SEM_MESA}
        onChange={(e) => onMove(guest.id, e.target.value)}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      >
        <option value={SEM_MESA}>Sem mesa</option>
        {tables.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </span>
  );
}

/** Convidado: arrastar pela alça ou escolher a mesa na lista. */
export function LinhaDoConvidado(props: PropriedadesDaLinha) {
  const { guest } = props;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: guest.id, data: { guest } });
  const seats = lugaresDe(guest);

  return (
    <li ref={setNodeRef} className={`flex min-h-11 items-center gap-1 rounded-xl border border-linha bg-papel pr-1 text-left ${isDragging ? "opacity-40" : ""}`}>
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        aria-label={`Arrastar ${guest.name}`}
        className="grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-xl text-tinta-suave active:cursor-grabbing"
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      <span className="min-w-0 flex-1 py-1 text-[15px] leading-5">
        <span className="block truncate">{guest.name}</span>
        {guest.parentGuest?.name && <span className="block truncate text-sm text-tinta-suave">Com {guest.parentGuest.name}</span>}
      </span>
      {guest.dietaryRestrictions && (
        <span className="inline-flex max-w-24 items-center truncate rounded-md bg-aviso-suave px-2 text-sm font-semibold leading-6 text-aviso" title={guest.dietaryRestrictions}>
          {guest.dietaryRestrictions}
        </span>
      )}
      <span className="inline-flex min-w-7 items-center justify-center rounded-md bg-areia px-2 text-sm font-semibold leading-6 text-tinta-suave" title={`${seats} ${seats === 1 ? "lugar" : "lugares"}`}>
        {seats}
      </span>
      <TrocaDeMesa {...props} />
    </li>
  );
}

/** Cópia que acompanha o ponteiro durante o arraste (não é cortada pela lista com rolagem). */
export function PreviaDoConvidado({ guest }: { guest: ConvidadoDaMesa }) {
  return (
    <div className="flex min-h-11 items-center gap-1 rounded-xl border-2 border-ameixa bg-ameixa-suave pr-3 shadow-[var(--shadow-aceito-2)]">
      <span className="grid size-11 place-items-center text-ameixa">
        <GripVertical className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{guest.name}</span>
      <span className="inline-flex min-w-7 items-center justify-center rounded-md bg-areia px-2 text-sm font-semibold leading-6 text-tinta-suave">{lugaresDe(guest)}</span>
    </div>
  );
}
