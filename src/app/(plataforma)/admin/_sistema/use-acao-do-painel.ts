"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Resultado = { success: true; message?: string } | { success: false; error: string };

/**
 * Painel com várias ações (aprovar, suspender, conceder...): só o botão da ação que está rodando mostra o spinner
 * e os outros ficam desabilitados. Sucesso vira aviso e atualiza a tela; falha vira o texto do erro, no painel e no aviso.
 */
export function useAcaoDoPainel() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run<T extends Resultado>(key: string, action: () => Promise<T>, afterOk?: (result: Extract<T, { success: true }>) => void) {
    setError(null);
    setRunning(key);
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        if (result.message) toast.success(result.message);
        afterOk?.(result as Extract<T, { success: true }>);
        router.refresh();
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  /** Executa algo dentro da mesma transição (para ações que não seguem o padrão acima). */
  function runCustom(key: string, task: () => Promise<void>) {
    setRunning(key);
    startTransition(task);
  }

  /** Verdadeiro só para o botão da ação que está rodando. */
  const carregando = (key: string) => pending && running === key;

  return { pending, error, run, runCustom, carregando };
}
