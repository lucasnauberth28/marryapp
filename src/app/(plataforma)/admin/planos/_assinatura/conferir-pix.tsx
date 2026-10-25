import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { confirmarAssinaturaManualmente, recusarAssinatura } from "@/actions/subscription-admin-actions";
import { Botao } from "@/components/ui/button";
import type { AssinaturaDoPainel } from "./tipos";

function useConferenciaDoPix(s: AssinaturaDoPainel) {
  const router = useRouter();
  const [confirmingReject, setConfirmingReject] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"confirm" | "reject" | null>(null);

  const run = (kind: "confirm" | "reject") => {
    setError("");
    setPendingAction(kind);
    startTransition(async () => {
      const res = kind === "confirm" ? await confirmarAssinaturaManualmente(s.id) : await recusarAssinatura(s.id);
      if (res.success) {
        toast.success(kind === "confirm" ? `Plano ${s.planName} liberado para ${s.accountName}.` : "Cobrança marcada como não recebida.");
        setConfirmingReject(false);
        router.refresh();
      } else setError(res.error);
      setPendingAction(null);
    });
  };

  return { confirmingReject, setConfirmingReject, error, isPending, pendingAction, run };
}

export function ConferirPix({ s }: { s: AssinaturaDoPainel }) {
  const [seen, setSeen] = useState(false);
  const { confirmingReject, setConfirmingReject, error, isPending, pendingAction, run } = useConferenciaDoPix(s);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run("confirm");
      }}
    >
      <p className="text-sm text-tinta-suave">Procure no extrato da conta um Pix de {s.amount} com este identificador na descrição. Só confirme depois de ver o crédito.</p>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[15px] text-tinta">
        <input type="checkbox" required checked={seen} onChange={(e) => setSeen(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-ameixa" />
        Vi o crédito de {s.amount} no extrato
      </label>

      {error ? (
        <p role="alert" className="rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
          {error}
        </p>
      ) : null}

      {confirmingReject ? (
        <div role="group" aria-label="Confirmar que o Pix não foi encontrado" className="flex flex-col gap-3 rounded-xl border border-linha bg-linho p-4">
          <p className="text-sm text-tinta">Marcar como não recebido? A cobrança deixa de valer e {s.accountName} precisa gerar um novo Pix.</p>
          <div className="flex flex-wrap gap-2">
            <Botao type="button" onClick={() => run("reject")} disabled={isPending} loading={pendingAction === "reject"} className="bg-perigo text-on-ameixa hover:bg-perigo/90">
              Sim, não recebi
            </Botao>
            <Botao type="button" variant="quiet" onClick={() => setConfirmingReject(false)} disabled={isPending}>
              Voltar
            </Botao>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Botao type="submit" disabled={isPending} loading={pendingAction === "confirm"}>
            Confirmar e liberar o plano
          </Botao>
          <Botao type="button" variant="quiet" onClick={() => setConfirmingReject(true)} disabled={isPending}>
            Não encontrei
          </Botao>
        </div>
      )}
    </form>
  );
}
