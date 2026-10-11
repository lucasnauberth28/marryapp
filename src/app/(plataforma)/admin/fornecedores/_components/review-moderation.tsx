"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { moderateReviewAction } from "@/actions/admin-fornecedores-actions";
import { btn } from "@/components/landing/styles";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Decisão sobre uma avaliação denunciada (manter no ar, ocultar com motivo) ou ocultada (reexibir). */
export function ReviewModeration({ reviewId, hidden, vendorName }: { reviewId: string; hidden: boolean; vendorName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hiding, setHiding] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (decision: "keep" | "hide" | "show") => {
    setError(null);
    startTransition(async () => {
      const res = await moderateReviewAction({ reviewId, decision, reason: decision === "hide" ? reason : undefined });
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
            <button type="button" disabled={pending || reason.trim().length < 5} onClick={() => run("hide")} className={cn(btn.secondary, btn.sm)}>
              <EyeOff className="size-4" aria-hidden="true" /> Ocultar avaliação
            </button>
            <button type="button" onClick={() => setHiding(false)} className={cn(btn.quiet, btn.sm)}>
              Voltar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {hidden ? (
            <button type="button" disabled={pending} onClick={() => run("show")} className={cn(btn.secondary, btn.sm)}>
              <Eye className="size-4" aria-hidden="true" /> Reexibir
              <span className="sr-only"> a avaliação sobre {vendorName}</span>
            </button>
          ) : (
            <>
              <button type="button" disabled={pending} onClick={() => run("keep")} className={cn(btn.secondary, btn.sm)}>
                <Check className="size-4" aria-hidden="true" /> Manter no ar
                <span className="sr-only"> a avaliação sobre {vendorName}</span>
              </button>
              <button type="button" disabled={pending} onClick={() => setHiding(true)} className={cn(btn.secondary, btn.sm)}>
                <EyeOff className="size-4" aria-hidden="true" /> Ocultar avaliação
                <span className="sr-only"> sobre {vendorName}</span>
              </button>
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
