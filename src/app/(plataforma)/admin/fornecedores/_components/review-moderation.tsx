"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { moderarAvaliacao } from "@/actions/admin-fornecedores-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** Decisão sobre uma avaliação denunciada (manter no ar, ocultar com motivo) ou ocultada (reexibir). */
export function ReviewModeration({ reviewId, hidden, vendorName }: { reviewId: string; hidden: boolean; vendorName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hiding, setHiding] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<"keep" | "hide" | "show" | null>(null); // só o botão clicado mostra o spinner

  const run = (decision: "keep" | "hide" | "show") => {
    setError(null);
    setRunning(decision);
    startTransition(async () => {
      const res = await moderarAvaliacao({ reviewId, decision, reason: decision === "hide" ? reason : undefined });
      if (res.success) {
        toast.success(res.message);
        setHiding(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {hiding ? (
        <div className="flex flex-col gap-3">
          <Textarea label="Motivo de ocultar" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} error={error ?? undefined} hint="Fica no registro de atividades." />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={reason.trim().length < 5 || pending} loading={pending && running === "hide"} onClick={() => run("hide")}>
              <EyeOff className="size-4" aria-hidden="true" /> Ocultar avaliação
            </Button>
            <Button type="button" variant="quiet" size="sm" onClick={() => setHiding(false)} disabled={pending}>
              Voltar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {hidden ? (
            <Button type="button" variant="outline" size="sm" disabled={pending} loading={pending && running === "show"} onClick={() => run("show")}>
              <Eye className="size-4" aria-hidden="true" /> Reexibir
              <span className="sr-only"> a avaliação sobre {vendorName}</span>
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" size="sm" disabled={pending} loading={pending && running === "keep"} onClick={() => run("keep")}>
                <Check className="size-4" aria-hidden="true" /> Manter no ar
                <span className="sr-only"> a avaliação sobre {vendorName}</span>
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setHiding(true)}>
                <EyeOff className="size-4" aria-hidden="true" /> Ocultar avaliação
                <span className="sr-only"> sobre {vendorName}</span>
              </Button>
            </>
          )}
        </div>
      )}
      {error && !hiding ? (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      ) : null}
    </div>
  );
}
