// O arraste dos convidados entre as mesas (mouse, toque e teclado).
import { useState } from "react";
import { KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import type { ConvidadoDaMesa, MesaComConvidados } from "./tipos";

export function useArrasteDeConvidados(tables: MesaComConvidados[], unassigned: ConvidadoDaMesa[], mover: (guestId: string, to: string) => Promise<void>) {
  const [dragging, setDragging] = useState<ConvidadoDaMesa | null>(null);
  const sensors = useSensors(
    // Um pequeno deslocamento evita arrastar sem querer ao tocar
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    setDragging(unassigned.find((g) => g.id === id) ?? tables.flatMap((t) => t.guests).find((g) => g.id === id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragging(null);
    const { active, over } = event;
    if (!over) return; // Soltou fora de qualquer mesa
    void mover(active.id as string, over.id as string);
  }

  return { dragging, sensors, handleDragStart, handleDragEnd, handleDragCancel: () => setDragging(null) };
}
