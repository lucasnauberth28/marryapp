"use client";
import { useRouter } from "next/navigation";
import { useSyncedState } from "@/hooks/use-synced-state";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { CustomModal } from "@/components/ui/custom-modal";
import { PageHeader } from "@/components/admin/page-header";
import { StatusChip } from "@/components/painel/status-chip";
import { btn, btnIconDanger, card, hint, input, label, errorBox } from "@/components/painel/styles";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { createTable, deleteTable, assignGuestToTable } from "@/actions/table-actions";
import { ArrowRightLeft, Check, GripVertical, Plus, Trash2, TriangleAlert, Users as UsersIcon } from "lucide-react";

// --- Tipos ---

export interface SeatGuest {
  id: string;
  name: string;
  category?: string | null;
  allowedCompanions: number;
  rsvpStatus?: "PENDING" | "CONFIRMED" | "DECLINED";
  dietaryRestrictions?: string | null;
  parentGuest?: { name: string } | null;
}

export interface TableWithGuests {
  id: string;
  name: string;
  capacity: number;
  guests: SeatGuest[];
}

const seatsOf = (g: SeatGuest) => 1 + (g.allowedCompanions || 0);

// --- Convidado: arrastar pela alça ou escolher a mesa na lista ---

function GuestRow({ guest, tables, currentTableId, onMove }: { guest: SeatGuest; tables: TableWithGuests[]; currentTableId: string | null; onMove: (guestId: string, to: string) => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: guest.id,
    data: { guest },
  });

  const seats = seatsOf(guest);

  return (
    <li
      ref={setNodeRef}
      className={`flex min-h-11 items-center gap-1 rounded-xl border border-linha bg-papel pr-1 text-left ${isDragging ? "opacity-40" : ""}`}
    >
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
      <span className="relative grid size-11 shrink-0 place-items-center rounded-xl text-tinta-suave has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-2 has-[select:focus-visible]:outline-ameixa">
        <ArrowRightLeft className="size-4" aria-hidden="true" />
        <select
          aria-label={`Escolher a mesa de ${guest.name}`}
          value={currentTableId ?? "unassigned"}
          onChange={(e) => onMove(guest.id, e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        >
          <option value="unassigned">Sem mesa</option>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </span>
    </li>
  );
}

/** Cópia que acompanha o ponteiro durante o arraste (não é cortada pela lista com rolagem). */
function GuestPreview({ guest }: { guest: SeatGuest }) {
  return (
    <div className="flex min-h-11 items-center gap-1 rounded-xl border-2 border-ameixa bg-ameixa-suave pr-3 shadow-[var(--shadow-aceito-2)]">
      <span className="grid size-11 place-items-center text-ameixa">
        <GripVertical className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{guest.name}</span>
      <span className="inline-flex min-w-7 items-center justify-center rounded-md bg-areia px-2 text-sm font-semibold leading-6 text-tinta-suave">{seatsOf(guest)}</span>
    </div>
  );
}

// --- Mesa: cartão com o círculo, o nome e a ocupação ---

function TableCard({
  table,
  number,
  tables,
  onDelete,
  onMove,
}: {
  table: TableWithGuests;
  number: number;
  tables: TableWithGuests[];
  onDelete: () => void;
  onMove: (guestId: string, to: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: table.id });

  // Total de lugares ocupados (convidado + acompanhantes)
  const occupied = table.guests.reduce((acc, g) => acc + seatsOf(g), 0);
  const over = occupied > table.capacity;
  const full = occupied === table.capacity;

  return (
    <article
      ref={setNodeRef}
      aria-label={`Mesa ${table.name}`}
      className={`${card} relative flex flex-col items-center gap-2 p-4 text-center transition-[outline-color] ${
        isOver ? "outline-2 outline-offset-2 outline-dashed outline-ameixa" : ""
      }`}
    >
      <div className="absolute right-1 top-1">
        <button type="button" onClick={onDelete} aria-label={`Excluir a mesa ${table.name}`} className={btnIconDanger}>
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div
        className={`grid size-24 place-items-center rounded-full bg-areia font-display text-[28px] text-tinta [font-variant-numeric:lining-nums] ${
          full ? "border-4 border-dotted border-sucesso" : over ? "border-4 border-dotted border-perigo" : ""
        }`}
        aria-hidden="true"
      >
        {number}
      </div>
      <strong className="max-w-full break-words font-semibold text-tinta">{table.name}</strong>
      {over ? (
        <StatusChip tone="perigo" icon={<TriangleAlert className="size-4" aria-hidden="true" />}>
          {occupied} de {table.capacity} · passou
        </StatusChip>
      ) : full ? (
        <StatusChip tone="sucesso" icon={<Check className="size-4" aria-hidden="true" />}>
          {occupied} de {table.capacity} · completa
        </StatusChip>
      ) : (
        <span className="text-sm text-tinta-suave">
          {occupied} de {table.capacity}
          {isOver && " · solte aqui"}
        </span>
      )}

      {table.guests.length > 0 ? (
        <ul className="mt-2 flex w-full flex-col gap-1.5">
          {table.guests.map((g) => (
            <GuestRow key={g.id} guest={g} tables={tables} currentTableId={table.id} onMove={onMove} />
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-tinta-suave">Arraste alguém para cá, ou escolha a mesa na lista.</p>
      )}
    </article>
  );
}

// --- Confirmados que ainda não têm mesa ---

function UnassignedPanel({ guests, tables, totalConfirmed, onMove }: { guests: SeatGuest[]; tables: TableWithGuests[]; totalConfirmed: number; onMove: (guestId: string, to: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });
  return (
    <section
      ref={setNodeRef}
      aria-labelledby="sem-mesa"
      className={`${card} flex w-full flex-col gap-2 p-4 sm:p-6 lg:sticky lg:top-24 lg:max-w-80 lg:flex-none ${isOver ? "outline-2 outline-offset-2 outline-dashed outline-ameixa" : ""}`}
    >
      <h2 id="sem-mesa" className="text-lg font-semibold leading-7 text-tinta">
        Sem mesa · {guests.length}
      </h2>
      {guests.length > 0 && <p className={`${hint} mb-2`}>Arraste pela alça para uma mesa, ou toque no ícone de troca e escolha.</p>}
      {guests.length > 0 ? (
        <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto lg:max-h-[640px]">
          {guests.map((g) => (
            <GuestRow key={g.id} guest={g} tables={tables} currentTableId={null} onMove={onMove} />
          ))}
        </ul>
      ) : (
        <p className="flex items-start gap-2 text-sm text-tinta-suave">
          <UsersIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {totalConfirmed > 0 ? "Todos os confirmados já têm mesa." : "Quem confirmar presença aparece aqui para ganhar mesa."}
        </p>
      )}
    </section>
  );
}

// --- Tela ---

export function TablesClient({ initialTables, initialUnassigned }: { initialTables: TableWithGuests[]; initialUnassigned: SeatGuest[] }) {
  const router = useRouter();
  const [tables, setTables] = useSyncedState<TableWithGuests[]>(initialTables);
  const [unassigned, setUnassigned] = useSyncedState<SeatGuest[]>(initialUnassigned);

  const [newOpen, setNewOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableCap, setNewTableCap] = useState(10);
  const [newError, setNewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toDelete, setToDelete] = useState<TableWithGuests | null>(null);
  const [dragging, setDragging] = useState<SeatGuest | null>(null);

  const sensors = useSensors(
    // Um pequeno deslocamento evita arrastar sem querer ao tocar
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const seatedConfirmed = tables.reduce((acc, t) => acc + t.guests.filter((g) => g.rsvpStatus === "CONFIRMED").length, 0);
  const totalConfirmed = seatedConfirmed + unassigned.length;

  async function moveGuest(guestId: string, toContainerId: string) {
    const fromContainerId = unassigned.some((g) => g.id === guestId) ? "unassigned" : tables.find((t) => t.guests.some((g) => g.id === guestId))?.id;
    if (!fromContainerId || fromContainerId === toContainerId) return;

    const guestObj = fromContainerId === "unassigned" ? unassigned.find((g) => g.id === guestId) : tables.find((t) => t.id === fromContainerId)?.guests.find((g) => g.id === guestId);
    if (!guestObj) return;

    // Atualiza a tela na hora e grava em seguida
    if (fromContainerId === "unassigned") {
      setUnassigned((prev) => prev.filter((g) => g.id !== guestId));
    } else {
      setTables((prev) => prev.map((t) => (t.id === fromContainerId ? { ...t, guests: t.guests.filter((g) => g.id !== guestId) } : t)));
    }

    if (toContainerId === "unassigned") {
      setUnassigned((prev) => [...prev, guestObj]);
    } else {
      setTables((prev) => prev.map((t) => (t.id === toContainerId ? { ...t, guests: [...t.guests, guestObj] } : t)));
    }

    const res = await assignGuestToTable(guestId, toContainerId === "unassigned" ? null : toContainerId);
    if (res.success) {
      toast.success(toContainerId === "unassigned" ? `${guestObj.name} voltou para a lista sem mesa.` : `${guestObj.name} está na mesa.`);
    } else {
      toast.error(res.error || "Não deu para mover agora. Tente de novo.");
      router.refresh();
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    setDragging(unassigned.find((g) => g.id === id) ?? tables.flatMap((t) => t.guests).find((g) => g.id === id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragging(null);
    const { active, over } = event;
    if (!over) return; // Soltou fora de qualquer mesa
    void moveGuest(active.id as string, over.id as string);
  }

  async function handleAddTable(e: React.FormEvent) {
    e.preventDefault();
    if (!newTableName.trim()) {
      setNewError("Dê um nome à mesa, por exemplo: Mesa dos padrinhos.");
      return;
    }
    setNewError(null);
    setLoading(true);
    const toastId = toast.loading("Criando a mesa...");
    const res = await createTable(newTableName, Number.isFinite(newTableCap) ? newTableCap : 10);
    if (res.success) {
      toast.success("Mesa criada.", { id: toastId });
      setNewTableName("");
      setNewTableCap(10);
      setNewOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Não deu para criar a mesa. Tente de novo.", { id: toastId });
      setNewError(res.error || "Não deu para criar a mesa. Tente de novo.");
    }
    setLoading(false);
  }

  async function handleDeleteTable(id: string) {
    const toastId = toast.loading("Removendo a mesa...");
    const res = await deleteTable(id);
    if (res.success) {
      toast.success("Mesa removida.", { id: toastId });
      router.refresh();
    } else {
      toast.error(res.error || "Não deu para remover agora. Tente de novo.", { id: toastId, duration: 6000 });
    }
  }

  const summary =
    tables.length === 0
      ? "Crie as mesas e depois arraste os convidados para cada uma."
      : `${seatedConfirmed} de ${totalConfirmed} ${totalConfirmed === 1 ? "confirmado já tem" : "confirmados já têm"} mesa · ${tables.length} ${tables.length === 1 ? "mesa" : "mesas"}`;

  return (
    <DndContext id="mesas" sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setDragging(null)}>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Convidados"
          title="Mesas"
          description={summary}
          actions={
            <button type="button" onClick={() => setNewOpen(true)} className={btn.primary}>
              <Plus className="size-4" aria-hidden="true" />
              Nova mesa
            </button>
          }
        />

        <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-start">
          <UnassignedPanel guests={unassigned} tables={tables} totalConfirmed={totalConfirmed} onMove={moveGuest} />

          {/* Planta das mesas */}
          <section aria-label="Planta das mesas" className="grid min-w-0 flex-1 grid-cols-[repeat(auto-fill,minmax(240px,1fr))] items-start gap-4">
            {tables.map((table, i) => (
              <TableCard key={table.id} table={table} number={i + 1} tables={tables} onDelete={() => setToDelete(table)} onMove={moveGuest} />
            ))}
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-linha-forte font-semibold text-tinta-suave transition-colors hover:bg-ameixa-suave hover:text-ameixa"
            >
              <Plus className="size-5" aria-hidden="true" />
              Nova mesa
            </button>
          </section>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>{dragging ? <GuestPreview guest={dragging} /> : null}</DragOverlay>

      <CustomModal isOpen={newOpen} onClose={() => setNewOpen(false)} title="Nova mesa" description="Escolha um nome e quantos lugares a mesa tem." size="sm">
        <form onSubmit={handleAddTable} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="new-table-name" className={label}>
              Nome da mesa
            </label>
            <input id="new-table-name" value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder="Ex.: Mesa dos padrinhos" autoComplete="off" aria-invalid={!!newError} className={input} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="new-table-capacity" className={label}>
              Lugares
            </label>
            <input
              id="new-table-capacity"
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              value={Number.isFinite(newTableCap) ? newTableCap : ""}
              onChange={(e) => setNewTableCap(parseInt(e.target.value))}
              className={input}
            />
          </div>
          {newError && (
            <p role="alert" className={errorBox}>
              {newError}
            </p>
          )}
          <button type="submit" disabled={loading} className={`${btn.primary} ${btn.block}`}>
            {loading ? "Criando..." : "Criar mesa"}
          </button>
        </form>
      </CustomModal>

      <ConfirmModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          const t = toDelete;
          setToDelete(null);
          if (t) void handleDeleteTable(t.id);
        }}
        title="Excluir mesa"
        description={toDelete ? `Excluir a mesa ${toDelete.name}? Quem está nela volta para a lista sem mesa.` : ""}
        confirmText="Excluir"
      />
    </DndContext>
  );
}
