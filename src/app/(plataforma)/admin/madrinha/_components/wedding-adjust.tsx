"use client";

import { useState } from "react";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { AvisoDoFormulario } from "@/components/ui/field";
import { Botao } from "@/components/ui/button";
import { aplicarAjusteAoCasamento, desbloquearMadrinhaDoCasamento } from "@/actions/madrinha/casamentos";
import type { ResultadoDeCasamento } from "@/lib/platform/queries/madrinha";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";
import { BuscaDeCasamento } from "./wedding-search";

function CasalEscolhido({ picked }: { picked: ResultadoDeCasamento }) {
  return (
    <p className="rounded-xl bg-areia px-3 py-2 text-sm leading-5 text-tinta">
      Casal escolhido: <strong className="font-semibold">{picked.coupleNames}</strong>
      {picked.override?.blocked ? " (hoje bloqueado)" : ""}
    </p>
  );
}

/** "Ajuste para um casal": mensagens a mais neste mês (com motivo) e desbloqueio. Só configuração salva. */
export function AjusteDoCasamento() {
  const [picked, setPicked] = useState<ResultadoDeCasamento | null>(null);
  const [extra, setExtra] = useState("0");
  const [reason, setReason] = useState("");
  const { pending, errors, formError, run } = useAcaoDoAdmin();
  const [running, setRunning] = useState<"apply" | "unblock" | null>(null); // só o botão clicado mostra o spinner

  function pick(hit: ResultadoDeCasamento) {
    setPicked(hit);
    setExtra(String(hit.override?.extraMessages ?? 0));
    setReason(hit.override?.note ?? "");
  }

  function unblock() {
    if (!picked) return;
    setRunning("unblock");
    run(() => desbloquearMadrinhaDoCasamento({ weddingId: picked.id }), () => setPicked({ ...picked, override: picked.override && { ...picked.override, blocked: false } }));
  }

  return (
    <form
      className="flex flex-1 flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!picked) return;
        setRunning("apply");
        run(() => aplicarAjusteAoCasamento({ weddingId: picked.id, extraMessages: extra, reason }));
      }}
    >
      <BuscaDeCasamento selectedId={picked?.id ?? null} onPick={pick} />
      {picked && <CasalEscolhido picked={picked} />}
      <Entrada label="Mensagens a mais neste mês" inputMode="numeric" value={extra} onChange={(e) => setExtra(e.target.value)} error={errors.extraMessages} disabled={!picked} />
      <AreaDeTexto label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} error={errors.reason} disabled={!picked} rows={3} />
      {formError && <AvisoDoFormulario>{formError}</AvisoDoFormulario>}
      <div className="mt-auto flex flex-wrap items-center gap-3">
        <Botao type="submit" variant="outline" disabled={pending || !picked} loading={pending && running === "apply"}>
          Aplicar ajuste
        </Botao>
        <Botao type="button" variant="quiet" disabled={pending || !picked || !picked.override?.blocked} loading={pending && running === "unblock"} onClick={unblock}>
          Desbloquear o casal
        </Botao>
      </div>
    </form>
  );
}
