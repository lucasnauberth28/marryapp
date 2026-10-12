"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { reportReview } from "@/actions/vendor-report-actions";
import { btn } from "@/components/landing/styles";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** "Denunciar": o fornecedor pede à administração do Aceito para analisar uma avaliação (não some sozinha). */
export function ReportReview({ reviewId, coupleNames }: { reviewId: string; coupleNames: string }) {
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn(btn.quiet, btn.sm, "-ml-3 min-h-11 self-start px-3")}>
        <Flag aria-hidden="true" className="size-4" />
        Denunciar
        <span className="sr-only"> a avaliação de {coupleNames}</span>
      </button>
    );
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-3 rounded-xl border border-linha bg-linho p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await reportReview(reviewId, reason);
          if (res.success) {
            toast.success("Denúncia enviada. A equipe do Aceito vai analisar.");
            setOpen(false);
            router.refresh();
          } else {
            setError(res.error);
          }
        });
      }}
    >
      <p className="text-sm text-tinta">
        Use a denúncia quando a avaliação for falsa, ofensiva ou de alguém que não foi seu cliente. A equipe analisa e decide se ela fica no ar.
      </p>
      <Textarea
        id={`${id}-motivo`}
        label="Por que você está denunciando?"
        rows={3}
        maxLength={500}
        value={reason}
        disabled={pending}
        onChange={(e) => setReason(e.target.value)}
        error={error ?? undefined}
        hint={`${reason.length}/500 caracteres`}
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => setOpen(false)} disabled={pending} className={cn(btn.secondary, btn.sm, "min-h-11")}>
          Cancelar
        </button>
        <Button type="submit" size="sm" loading={pending}>
          Enviar denúncia
        </Button>
      </div>
    </form>
  );
}
