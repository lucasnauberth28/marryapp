"use client";

import { useState } from "react";
import { DndContext, useDraggable, useDroppable, DragEndEvent } from "@dnd-kit/core";
import { createTable, deleteTable, assignGuestToTable } from "@/actions/table-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Users as UsersIcon, Loader2 } from "lucide-react";

// --- DND Components ---

function DraggableGuest({ guest }: { guest: any }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: guest.id,
    data: { guest },
  });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white border border-zinc-200 p-2 mb-2 rounded-md shadow-sm text-sm font-medium cursor-grab active:cursor-grabbing hover:border-zinc-300 transition-colors flex items-center justify-between"
    >
      <span>{guest.name}</span>
      {guest.allowedCompanions > 0 && (
        <span className="text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">+{guest.allowedCompanions}</span>
      )}
    </div>
  );
}

function DroppableTable({ id, title, capacity, guests, onDelete }: { id: string, title: string, capacity: number, guests: any[], onDelete?: () => void }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  // Calcula o total de assentos ocupados (convidado + acompanhantes)
  const occupied = guests.reduce((acc, g) => acc + 1 + (g.allowedCompanions || 0), 0);
  const isFull = occupied > capacity;

  return (
    <div
      ref={setNodeRef}
      className={`p-4 rounded-xl border-2 min-h-[200px] flex flex-col transition-colors ${
        isOver ? "border-emerald-400 bg-emerald-50/50" : "border-dashed border-zinc-200 bg-zinc-50/50"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-zinc-900">{title}</h3>
          <span className={`text-xs font-medium ${isFull ? "text-red-500" : "text-zinc-500"}`}>
            {occupied} / {capacity} lugares
          </span>
        </div>
        {onDelete && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-500" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex-1">
        {guests.map(g => <DraggableGuest key={g.id} guest={g} />)}
        {guests.length === 0 && <p className="text-zinc-400 text-sm text-center italic mt-4">Arraste convidados para cá</p>}
      </div>
    </div>
  );
}

// --- Main Client Component ---

export function TablesClient({ initialTables, initialUnassigned }: { initialTables: any[], initialUnassigned: any[] }) {
  const [tables, setTables] = useState<any[]>(initialTables);
  const [unassigned, setUnassigned] = useState<any[]>(initialUnassigned);
  
  const [newTableName, setNewTableName] = useState("");
  const [newTableCap, setNewTableCap] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return; // Dropped outside

    const guestId = active.id as string;
    const fromContainerId = unassigned.find(g => g.id === guestId) ? "unassigned" : tables.find(t => t.guests.some((g: any) => g.id === guestId))?.id;
    const toContainerId = over.id as string;

    if (fromContainerId === toContainerId) return;

    // Achar o guest inteiro
    let guestObj: any;
    if (fromContainerId === "unassigned") {
      guestObj = unassigned.find(g => g.id === guestId);
    } else {
      guestObj = tables.find(t => t.id === fromContainerId)?.guests.find((g: any) => g.id === guestId);
    }

    if (!guestObj) return;

    // Atualiza estado local otimisticamente
    if (fromContainerId === "unassigned") {
      setUnassigned(prev => prev.filter(g => g.id !== guestId));
    } else {
      setTables(prev => prev.map(t => t.id === fromContainerId ? { ...t, guests: t.guests.filter((g: any) => g.id !== guestId) } : t));
    }

    if (toContainerId === "unassigned") {
      setUnassigned(prev => [...prev, guestObj]);
    } else {
      setTables(prev => prev.map(t => t.id === toContainerId ? { ...t, guests: [...t.guests, guestObj] } : t));
    }

    // Grava no banco em background
    const targetTableId = toContainerId === "unassigned" ? null : toContainerId;
    await assignGuestToTable(guestId, targetTableId);
  };

  const handleAddTable = async () => {
    if (!newTableName.trim()) return;
    setLoading(true);
    const res = await createTable(newTableName, newTableCap);
    if (res.success) {
      window.location.reload();
    }
    setLoading(false);
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm("Excluir mesa? Os convidados voltarão para a lista de não alocados.")) return;
    const res = await deleteTable(id);
    if (res.success) {
      window.location.reload();
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Lista de Convidados (Não Alocados) */}
        <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-xl flex flex-col max-h-[800px] overflow-hidden">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <UsersIcon className="w-4 h-4" /> Sem Mesa
            </h3>
            <p className="text-xs text-zinc-500 mt-1">{unassigned.length} convidados aguardando</p>
          </div>
          <div className="p-4 overflow-y-auto flex-1">
            <DroppableTable id="unassigned" title="" capacity={999} guests={unassigned} />
          </div>
        </div>

        {/* Mesas */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Controls */}
          <div className="bg-white p-4 border border-zinc-200 rounded-xl flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Nome da Mesa</label>
              <Input value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="Ex: Mesa dos Padrinhos" />
            </div>
            <div className="w-32">
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Lugares</label>
              <Input type="number" value={newTableCap} onChange={e => setNewTableCap(parseInt(e.target.value))} />
            </div>
            <Button onClick={handleAddTable} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Nova Mesa
            </Button>
          </div>

          {/* Grid de Mesas */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tables.map(table => (
              <DroppableTable 
                key={table.id}
                id={table.id}
                title={table.name}
                capacity={table.capacity}
                guests={table.guests}
                onDelete={() => handleDeleteTable(table.id)}
              />
            ))}
          </div>

        </div>
      </div>
    </DndContext>
  );
}
