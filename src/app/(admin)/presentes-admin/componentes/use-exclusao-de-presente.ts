import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { excluirPresente } from "@/actions/gift-actions";

/** Pede a confirmação e exclui o presente da lista do site. */
export function useExclusaoDePresente(aoExcluido: (id: string) => void) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [paraExcluir, setParaExcluir] = useState<string | null>(null);

  function excluir(id: string) {
    setDeletingId(id);
    const toastId = toast.loading("Excluindo o presente...");
    startTransition(async () => {
      const result = await excluirPresente(id);
      if (!result.success) toast.error(result.error || "Não deu para excluir o presente. Tente de novo.", { id: toastId, duration: 6000 });
      else {
        aoExcluido(id);
        toast.success("Presente excluído.", { id: toastId });
        router.refresh();
      }
      setDeletingId(null);
    });
  }

  const confirmar = () => {
    const id = paraExcluir;
    setParaExcluir(null);
    if (id) excluir(id);
  };

  return { isPending, deletingId, aberto: paraExcluir !== null, pedir: setParaExcluir, fechar: () => setParaExcluir(null), confirmar };
}
