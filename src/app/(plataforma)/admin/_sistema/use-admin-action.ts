"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

/**
 * Chama uma Server Action da administração: bloqueia o botão enquanto roda, mostra o aviso de sucesso (toast)
 * e guarda a mensagem geral e os erros por campo para o formulário. Qualquer erro inesperado vira texto amigável.
 */
export type ResultadoDaAcao = { success: true; message?: string } | { success: false; error: string; fieldErrors?: Record<string, string> };

export function useAcaoDoAdmin() {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function run<T extends ResultadoDaAcao>(task: () => Promise<T>, onSuccess?: (result: Extract<T, { success: true }>) => void) {
    startTransition(async () => {
      setErrors({});
      setFormError(null);
      try {
        const result = await task();
        if (result.success) {
          toast.success(result.message ?? "Salvo.");
          onSuccess?.(result as Extract<T, { success: true }>);
        } else {
          setFormError(result.error);
          setErrors(result.fieldErrors ?? {});
        }
      } catch {
        setFormError("Não foi possível concluir agora. Tente de novo.");
      }
    });
  }

  const clear = () => {
    setErrors({});
    setFormError(null);
  };

  return { pending, errors, formError, run, clear };
}
