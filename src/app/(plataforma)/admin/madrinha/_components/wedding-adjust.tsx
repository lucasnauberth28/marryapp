"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { applyWeddingAdjustment, unblockWeddingMadrinha } from "@/actions/admin-madrinha-actions";
import type { ResultadoDeCasamento } from "@/lib/platform/queries/madrinha";
import { useAdminAction } from "../../_sistema/use-admin-action";
import { WeddingSearch } from "./wedding-search";

/** "Ajuste para um casal": mensagens a mais neste mês (com motivo) e desbloqueio. Só configuração salva. */
export function WeddingAdjust() {
  const [picked, setPicked] = useState<ResultadoDeCasamento | null>(null);
  const [extra, setExtra] = useState("0");
  const [reason, setReason] = useState("");
  const { pending, errors, formError, run } = useAdminAction();
  const [running, setRunning] = useState<"apply" | "unblock" | null>(null); // só o botão clicado mostra o spinner

  function pick(hit: ResultadoDeCasamento) {
    setPicked(hit);
    setExtra(String(hit.override?.extraMessages ?? 0));
    setReason(hit.override?.note ?? "");
  }

  return (
    <form
      className="flex flex-1 flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!picked) return;
        setRunning("apply");
        run(() => applyWeddingAdjustment({ weddingId: picked.id, extraMessages: extra, reason }));
      }}
    >
      <WeddingSearch selectedId={picked?.id ?? null} onPick={pick} />
      {picked && (
        <p className="rounded-xl bg-areia px-3 py-2 text-sm leading-5 text-tinta">
          Casal escolhido: <strong className="font-semibold">{picked.coupleNames}</strong>
          {picked.override?.blocked ? " (hoje bloqueado)" : ""}
        </p>
      )}
      <Input label="Mensagens a mais neste mês" inputMode="numeric" value={extra} onChange={(e) => setExtra(e.target.value)} error={errors.extraMessages} disabled={!picked} />
      <Textarea label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} error={errors.reason} disabled={!picked} rows={3} />
      {formError && <FormAlert>{formError}</FormAlert>}
      <div className="mt-auto flex flex-wrap items-center gap-3">
        <Button type="submit" variant="outline" disabled={pending || !picked} loading={pending && running === "apply"}>
          Aplicar ajuste
        </Button>
        <Button
          type="button"
          variant="quiet"
          disabled={pending || !picked || !picked.override?.blocked}
          loading={pending && running === "unblock"}
          onClick={() => {
            if (!picked) return;
            setRunning("unblock");
            run(() => unblockWeddingMadrinha({ weddingId: picked.id }), () => setPicked({ ...picked, override: picked.override && { ...picked.override, blocked: false } }));
          }}
        >
          Desbloquear o casal
        </Button>
      </div>
    </form>
  );
}
