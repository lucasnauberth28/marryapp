// Arrastar da lista até a mesa (mouse e caneta; no toque vale tocar no nome e depois na mesa).
import { useEffect } from "react";
import type { ConvidadoParaSentar } from "@/lib/mesas3d/seating";
import type { ReferenciasDaVisao } from "./tipos";

export function useArrastarConvidado(refs: ReferenciasDaVisao, setDropId: (id: string | null) => void, seat: (guest: ConvidadoParaSentar, tableId: string | null) => Promise<boolean>) {
  const { dragRef, ghostRef, engineRef, suppressClickRef } = refs;
  useEffect(() => {
    function move(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      if (!d.live && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
      d.live = true;
      const ghost = ghostRef.current;
      if (ghost) {
        ghost.hidden = false;
        ghost.textContent = d.guest.name;
        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;
      }
      const t = engineRef.current?.tableAtPoint(e.clientX, e.clientY) ?? null;
      setDropId(t && !t.decor ? t.id : null);
    }
    function up(e: PointerEvent) {
      const d = dragRef.current;
      dragRef.current = null;
      if (ghostRef.current) ghostRef.current.hidden = true;
      setDropId(null);
      if (!d?.live) return;
      const t = engineRef.current?.tableAtPoint(e.clientX, e.clientY) ?? null;
      if (t) void seat(d.guest, t.id);
      suppressClickRef.current = true;
      window.setTimeout(() => (suppressClickRef.current = false), 0);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [seat, setDropId, dragRef, ghostRef, engineRef, suppressClickRef]);
}
