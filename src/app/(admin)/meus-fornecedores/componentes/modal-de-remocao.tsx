import { toast } from "sonner";
import { excluirFornecedor } from "@/actions/vendor-actions";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import type { FornecedorDoCasamento } from "./tipos";

interface PropriedadesDoModal {
  fornecedor: FornecedorDoCasamento | null;
  aoFechar: () => void;
  aoRemovido: (id: string) => void;
}

export function ModalDeRemocaoDoFornecedor({ fornecedor, aoFechar, aoRemovido }: PropriedadesDoModal) {
  async function remover(v: FornecedorDoCasamento) {
    const toastId = toast.loading("Removendo o fornecedor...");
    const res = await excluirFornecedor(v.id);
    if (!res.success) return void toast.error(res.error || "Não deu para remover o fornecedor. Tente de novo.", { id: toastId });
    aoRemovido(v.id);
    toast.success("Fornecedor removido.", { id: toastId });
  }

  return (
    <ModalDeConfirmacao
      isOpen={fornecedor !== null}
      onClose={aoFechar}
      onConfirm={() => {
        aoFechar();
        if (fornecedor) void remover(fornecedor);
      }}
      title="Remover fornecedor"
      description="Tem certeza de que deseja remover este fornecedor da lista?"
    />
  );
}
