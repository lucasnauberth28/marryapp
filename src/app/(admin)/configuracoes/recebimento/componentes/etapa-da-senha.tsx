import { useId, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import type { RespostaDoRepasse } from "@/actions/payout-actions";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";

interface PropriedadesDaEtapaDaSenha {
  title: string;
  help: string;
  submitLabel: string;
  danger?: boolean;
  pendingToast: string;
  onCancel: () => void;
  run: (password: string) => Promise<RespostaDoRepasse>;
  onDone: (res: RespostaDoRepasse) => boolean;
}

/** Pede só a senha (confirmar ou remover). A senha nunca fica guardada: some do estado ao terminar. */
export function EtapaDaSenha({ title, help, submitLabel, danger, pendingToast, onCancel, run, onDone }: PropriedadesDaEtapaDaSenha) {
  const uid = useId();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const toastId = toast.loading(pendingToast);
    startTransition(async () => {
      const res = await run(password);
      setPassword("");
      toast.dismiss(toastId);
      if (!res.success) setError(res.error);
      else onDone(res);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-linha bg-linho p-4 sm:p-5" aria-label={title}>
      <div>
        <h2 className="text-lg font-semibold leading-6 text-tinta">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-tinta-suave">{help}</p>
      </div>
      <Entrada id={`${uid}-senha`} label="Sua senha do Aceito" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error ?? undefined} fieldClassName="sm:max-w-[360px]" />
      <div className="flex flex-wrap gap-2">
        <Botao type="submit" variant={danger ? "danger" : "default"} loading={pending} disabled={password.length === 0}>
          {submitLabel}
        </Botao>
        <Botao type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancelar
        </Botao>
      </div>
    </form>
  );
}
