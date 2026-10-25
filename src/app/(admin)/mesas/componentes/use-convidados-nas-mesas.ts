// As mesas e os convidados sem mesa na tela, e a troca de um convidado de lugar (atualiza na hora e grava em seguida).
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { colocarConvidadoNaMesa } from "@/actions/table-actions";
import { useEstadoSincronizado } from "@/hooks/use-synced-state";
import { SEM_MESA, type ConvidadoDaMesa, type MesaComConvidados } from "./tipos";

export function useConvidadosNasMesas(initialTables: MesaComConvidados[], initialUnassigned: ConvidadoDaMesa[]) {
  const router = useRouter();
  const [tables, setTables] = useEstadoSincronizado<MesaComConvidados[]>(initialTables);
  const [unassigned, setUnassigned] = useEstadoSincronizado<ConvidadoDaMesa[]>(initialUnassigned);

  const seatedConfirmed = tables.reduce((acc, t) => acc + t.guests.filter((g) => g.rsvpStatus === "CONFIRMED").length, 0);

  async function moveGuest(guestId: string, toContainerId: string) {
    const from = unassigned.some((g) => g.id === guestId) ? SEM_MESA : tables.find((t) => t.guests.some((g) => g.id === guestId))?.id;
    if (!from || from === toContainerId) return;
    const guest = from === SEM_MESA ? unassigned.find((g) => g.id === guestId) : tables.find((t) => t.id === from)?.guests.find((g) => g.id === guestId);
    if (!guest) return;

    if (from === SEM_MESA) setUnassigned((prev) => prev.filter((g) => g.id !== guestId));
    else setTables((prev) => prev.map((t) => (t.id === from ? { ...t, guests: t.guests.filter((g) => g.id !== guestId) } : t)));
    if (toContainerId === SEM_MESA) setUnassigned((prev) => [...prev, guest]);
    else setTables((prev) => prev.map((t) => (t.id === toContainerId ? { ...t, guests: [...t.guests, guest] } : t)));

    const res = await colocarConvidadoNaMesa(guestId, toContainerId === SEM_MESA ? null : toContainerId);
    if (res.success) return void toast.success(toContainerId === SEM_MESA ? `${guest.name} voltou para a lista sem mesa.` : `${guest.name} está na mesa.`);
    toast.error(res.error || "Não deu para mover agora. Tente de novo.");
    router.refresh();
  }

  return { tables, unassigned, seatedConfirmed, totalConfirmed: seatedConfirmed + unassigned.length, moveGuest };
}
