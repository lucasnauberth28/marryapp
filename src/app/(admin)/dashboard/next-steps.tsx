"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { updateTask } from "@/actions/tasks";
import { Badge } from "@/components/ui/badge";

export interface NextStep {
  id: string;
  title: string;
  /** Rótulo do prazo ("Até 30 out", "Atrasada", "Em andamento") ou null. */
  dueLabel: string | null;
  tone: "perigo" | "aviso" | "neutro";
}

/**
 * "Próximos passos": as tarefas abertas do casal, com caixa para concluir na hora.
 * Marcar chama a mesma ação da tela de Tarefas; se a conta não puder, a caixa volta e o aviso aparece.
 */
export function NextSteps({ steps }: { steps: NextStep[] }) {
  const router = useRouter();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function complete(id: string, checked: boolean) {
    if (!checked) return;
    setError(null);
    setDone((prev) => new Set(prev).add(id));
    startTransition(async () => {
      let message: string | null = null;
      try {
        const res = await updateTask(id, { status: "DONE" });
        if (!res.success) message = res.error ?? "Não deu para concluir a tarefa. Tente de novo.";
      } catch {
        message = "Não deu para concluir a tarefa. Tente de novo.";
      }
      if (message) {
        setDone((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setError(message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <ul className="flex flex-col">
        {steps.map((s) => {
          const isDone = done.has(s.id);
          return (
            <li key={s.id} className="border-b border-linha last:border-b-0">
              <label className="flex min-h-[52px] cursor-pointer items-center gap-3 py-1 md:min-h-12">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={(e) => complete(s.id, e.target.checked)}
                  disabled={isDone}
                  className="size-[22px] shrink-0 cursor-pointer accent-ameixa md:size-5"
                />
                <span className={`min-w-0 flex-1 ${isDone ? "text-tinta-suave line-through" : "text-tinta"}`}>{s.title}</span>
                {s.dueLabel && !isDone && (
                  <Badge variant={s.tone === "perigo" ? "perigo" : s.tone === "aviso" ? "aviso" : "neutro"} className="shrink-0">
                    {s.tone !== "perigo" && <Clock aria-hidden="true" />}
                    {s.dueLabel}
                  </Badge>
                )}
              </label>
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-perigo">
          {error}
        </p>
      )}
    </div>
  );
}
