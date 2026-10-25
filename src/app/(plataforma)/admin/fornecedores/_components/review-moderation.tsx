"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { moderarAvaliacao } from "@/actions/admin-fornecedores-actions";
import { Botao } from "@/components/ui/button";
import { AreaDeTexto } from "@/components/ui/textarea";

interface PropriedadesDoFormulario {
  reason: string;
  aoMudar: (texto: string) => void;
  error: string | null;
  pending: boolean;
  carregando: boolean;
  aoOcultar: () => void;
  aoVoltar: () => void;
}

function FormularioDeOcultar({ reason, aoMudar, error, pending, carregando, aoOcultar, aoVoltar }: PropriedadesDoFormulario) {
  return (
    <div className="flex flex-col gap-3">
      <AreaDeTexto label="Motivo de ocultar" rows={2} maxLength={500} value={reason} onChange={(e) => aoMudar(e.target.value)} error={error ?? undefined} hint="Fica no registro de atividades." />
      <div className="flex flex-wrap gap-2">
        <Botao type="button" variant="outline" size="sm" disabled={reason.trim().length < 5 || pending} loading={carregando} onClick={aoOcultar}>
          <EyeOff className="size-4" aria-hidden="true" /> Ocultar avaliação
        </Botao>
        <Botao type="button" variant="quiet" size="sm" onClick={aoVoltar} disabled={pending}>
          Voltar
        </Botao>
      </div>
    </div>
  );
}

type Decisao = "keep" | "hide" | "show";

interface PropriedadesDosBotoes {
  hidden: boolean;
  vendorName: string;
  pending: boolean;
  running: Decisao | null;
  aoDecidir: (decisao: Decisao) => void;
  aoAbrirOcultar: () => void;
}

function BotoesDeDecisao({ hidden, vendorName, pending, running, aoDecidir, aoAbrirOcultar }: PropriedadesDosBotoes) {
  if (hidden) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Botao type="button" variant="outline" size="sm" disabled={pending} loading={running === "show"} onClick={() => aoDecidir("show")}>
          <Eye className="size-4" aria-hidden="true" /> Reexibir
          <span className="sr-only"> a avaliação sobre {vendorName}</span>
        </Botao>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Botao type="button" variant="outline" size="sm" disabled={pending} loading={running === "keep"} onClick={() => aoDecidir("keep")}>
        <Check className="size-4" aria-hidden="true" /> Manter no ar
        <span className="sr-only"> a avaliação sobre {vendorName}</span>
      </Botao>
      <Botao type="button" variant="outline" size="sm" disabled={pending} onClick={aoAbrirOcultar}>
        <EyeOff className="size-4" aria-hidden="true" /> Ocultar avaliação
        <span className="sr-only"> sobre {vendorName}</span>
      </Botao>
    </div>
  );
}

/** Decisão sobre uma avaliação denunciada (manter no ar, ocultar com motivo) ou ocultada (reexibir). */
export function ModeracaoDeAvaliacao({ reviewId, hidden, vendorName }: { reviewId: string; hidden: boolean; vendorName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hiding, setHiding] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<Decisao | null>(null); // só o botão clicado mostra o spinner

  const run = (decision: Decisao) => {
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
        <FormularioDeOcultar reason={reason} aoMudar={setReason} error={error} pending={pending} carregando={pending && running === "hide"} aoOcultar={() => run("hide")} aoVoltar={() => setHiding(false)} />
      ) : (
        <BotoesDeDecisao hidden={hidden} vendorName={vendorName} pending={pending} running={pending ? running : null} aoDecidir={run} aoAbrirOcultar={() => setHiding(true)} />
      )}
      {error && !hiding ? (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      ) : null}
    </div>
  );
}
