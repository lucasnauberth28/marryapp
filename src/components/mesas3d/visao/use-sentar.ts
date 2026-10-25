import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { colocarConvidadoNaMesa } from "@/actions/table-actions";
import { podeSentar, type ConvidadoParaSentar } from "@/lib/mesas3d/seating";
import type { EstadoAoVivo } from "./tipos";

/** Senta (ou tira da mesa) um convidado: confere a capacidade, atualiza na hora e desfaz se o servidor recusar. */
export function useSentar(live: React.RefObject<EstadoAoVivo>, setGuests: React.Dispatch<React.SetStateAction<ConvidadoParaSentar[]>>) {
  const sentarAgora = async (guest: ConvidadoParaSentar, tableId: string | null): Promise<boolean> => {
    const { slotsById: byId, occ: current, guests: all } = live.current;
    const latest = all.find((g) => g.id === guest.id) ?? guest;
    if (tableId) {
      const slot = byId.get(tableId);
      if (!slot || slot.decor) {
        toast("Esta é a cabeceira do cenário. Para sentar convidados nela, criem uma mesa chamada “Mesa dos noivos”.");
        return false;
      }
      if (latest.tableId === tableId) return true;
      if (!podeSentar(slot.cap, current[tableId], latest, tableId)) {
        toast.error(`${slot.nome} está cheia (${slot.cap} ${slot.cap === 1 ? "lugar" : "lugares"}). Aumentem a capacidade na lista de mesas ou escolham outra.`);
        return false;
      }
    }
    const before = latest.tableId;
    setGuests((gs) => gs.map((g) => (g.id === guest.id ? { ...g, tableId } : g)));
    try {
      const res = await colocarConvidadoNaMesa(guest.id, tableId);
      if (!res.success) throw new Error(res.error);
      const first = guest.name.split(" ")[0];
      toast.success(tableId ? `${first} sentou na ${byId.get(tableId)?.nome ?? "mesa"}.` : `${first} voltou para “sem mesa”.`);
      return true;
    } catch (e) {
      setGuests((gs) => gs.map((g) => (g.id === guest.id ? { ...g, tableId: before } : g)));
      toast.error(e instanceof Error && e.message ? e.message : "Não deu para mover o convidado. Tente de novo.");
      return false;
    }
  };

  // Identidade estável: o motor 3D e o arrasto guardam esta função sem recriar tudo a cada render.
  const ultima = useRef(sentarAgora);
  useEffect(() => {
    ultima.current = sentarAgora;
  });
  return useCallback((guest: ConvidadoParaSentar, tableId: string | null) => ultima.current(guest, tableId), []);
}
