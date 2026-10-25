import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { excluirMesa } from "@/actions/table-actions";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import type { MesaComConvidados } from "./tipos";

export function ModalDeExclusaoDaMesa({ mesa, onClose }: { mesa: MesaComConvidados | null; onClose: () => void }) {
  const router = useRouter();

  async function excluir(id: string) {
    const idDoAviso = toast.loading("Removendo a mesa...");
    const res = await excluirMesa(id);
    if (res.success) {
      toast.success("Mesa removida.", { id: idDoAviso });
      router.refresh();
    } else toast.error(res.error || "Não deu para remover agora. Tente de novo.", { id: idDoAviso, duration: 6000 });
  }

  return (
    <ModalDeConfirmacao
      isOpen={!!mesa}
      onClose={onClose}
      onConfirm={() => {
        onClose();
        if (mesa) void excluir(mesa.id);
      }}
      title="Excluir mesa"
      description={mesa ? `Excluir a mesa ${mesa.name}? Quem está nela volta para a lista sem mesa.` : ""}
      confirmText="Excluir"
    />
  );
}
