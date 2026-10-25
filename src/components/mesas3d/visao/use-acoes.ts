// As ações da tela das mesas em 3D que mexem na câmera, no cenário e na mesa aberta.
import { toast } from "sonner";
import { definirCenarioDasMesas3D } from "@/actions/table3d-actions";
import type { PredefinicaoDaCamera } from "@/lib/mesas3d/engine";
import type { IdDoCenario } from "@/lib/mesas3d/scenarios";
import { combinaComNome, type ConvidadoParaSentar } from "@/lib/mesas3d/seating";
import type { EstadoDaVisao } from "./use-estado";
import type { ReferenciasDaVisao } from "./tipos";

/** Quem aparece na lista: no link compartilhado só a busca pelo nome; no modo do casal, o filtro e a busca. */
export function convidadosDaLista(edit: boolean, guests: ConvidadoParaSentar[], filter: "sem" | "todos", q: string) {
  if (!edit) return q ? guests.filter((g) => combinaComNome(g.name, q)) : [];
  return guests.filter((g) => {
    if (filter === "sem" && g.tableId) return false;
    return !q || combinaComNome(g.name, q);
  });
}

export function dicaDaTela(edit: boolean, selectedId: string | null, guests: ConvidadoParaSentar[]) {
  if (!edit) return "Procure seu nome na lista: a câmera leva até a sua mesa. Só o casal altera as mesas.";
  if (selectedId) return `${guests.find((g) => g.id === selectedId)?.name ?? "O convidado"} escolhido. Toque ou clique em uma mesa para sentar.`;
  return "Arraste um convidado até a mesa. No celular, toque no nome e depois na mesa. Gire o cenário com o dedo ou o mouse.";
}

export function useAcoesDaVisao(edit: boolean, estado: EstadoDaVisao, { engineRef }: ReferenciasDaVisao) {
  const { setCam, setOpenId, setScene, setGalleryOpen } = estado;

  function focusGuest(g: ConvidadoParaSentar) {
    if (!g.tableId) return void toast(`${g.name.split(" ")[0]} ainda não tem mesa.`);
    engineRef.current?.setSearchRing(g.tableId);
    engineRef.current?.irParaMesa(g.tableId);
    setCam(null);
    setOpenId(g.tableId);
  }

  function pickScene(id: IdDoCenario) {
    setScene(id);
    setGalleryOpen(false);
    setOpenId(null);
    if (edit) {
      void definirCenarioDasMesas3D(id).then((r) => {
        if (!r.success) toast.error(r.error);
      });
    }
  }

  function goCam(p: PredefinicaoDaCamera) {
    engineRef.current?.preset(p);
    setCam(p);
  }

  function fecharMesa() {
    setOpenId(null);
    engineRef.current?.setSearchRing(null);
  }

  function verDaMesa(id: string) {
    engineRef.current?.vistaDaMesa(id);
    setCam(null);
  }

  return { focusGuest, pickScene, goCam, fecharMesa, verDaMesa };
}
