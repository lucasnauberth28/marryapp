import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelarPedidoDeDominio } from "@/actions/domain-actions";
import { Botao } from "@/components/ui/button";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";

export function BotaoDeCancelar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await cancelarPedidoDeDominio();
      if (result.success) {
        toast.success("Pedido cancelado.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
        setOpen(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 border-t border-linha pt-4">
      <p className="text-sm text-tinta-suave">Mudaram de ideia? Dá para cancelar enquanto o registro não começou.</p>
      <div>
        <Botao type="button" variant="danger" onClick={() => setOpen(true)}>
          Cancelar o pedido
        </Botao>
      </div>
      <ModalDeConfirmacao
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        title="Cancelar o pedido do endereço?"
        description="Apagamos os dados do titular e liberamos o nome. Vocês podem fazer um novo pedido quando quiserem."
        confirmText="Cancelar o pedido"
        cancelText="Voltar"
        isLoading={pending}
      />
    </div>
  );
}
