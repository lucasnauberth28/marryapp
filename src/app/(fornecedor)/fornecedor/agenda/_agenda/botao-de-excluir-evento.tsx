"use client";
// Excluir compromisso (confirmação em dois toques).
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { excluirEventoDoFornecedor } from "@/actions/vendor-panel-actions";
import { cn } from "@/lib/utils";
import { ESTILO_DO_BOTAO } from "./tipos";

export function BotaoDeExcluirEvento({ eventId, label, onDeleted }: { eventId: string; label: string; onDeleted?: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (!confirming) return setConfirming(true);
    startTransition(async () => {
      const res = await excluirEventoDoFornecedor(eventId);
      if (res.success) {
        toast.success("Compromisso removido da agenda.");
        return onDeleted?.();
      }
      toast.error(res.error ?? "Não foi possível excluir.");
      setConfirming(false);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onBlur={() => !isPending && setConfirming(false)}
      disabled={isPending}
      className={cn(ESTILO_DO_BOTAO, "min-h-11 px-3 text-sm", confirming ? "bg-perigo-suave text-perigo" : "text-tinta-suave hover:bg-areia hover:text-tinta")}
    >
      {isPending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Trash2 aria-hidden="true" className="size-4" />}
      {confirming ? "Confirmar exclusão" : label}
    </button>
  );
}
