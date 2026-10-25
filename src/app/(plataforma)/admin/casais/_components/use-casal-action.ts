"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ResultadoDaAcaoDoCasal } from "@/actions/admin-casais-actions";

/** Chama uma Server Action do casal: trava o botão, mostra o aviso de sucesso e guarda a mensagem de erro para o formulário. */
export function useAcaoDoCasal() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(task: () => Promise<ResultadoDaAcaoDoCasal>, onSuccess?: (message?: string) => void) {
    startTransition(async () => {
      setError(null);
      try {
        const result = await task();
        if (result.success) {
          toast.success(result.message ?? "Pronto.");
          onSuccess?.(result.message);
        } else {
          setError(result.error);
        }
      } catch {
        setError("Não foi possível concluir agora. Tente de novo.");
      }
    });
  }
  return { pending, error, run, clearError: () => setError(null) };
}
