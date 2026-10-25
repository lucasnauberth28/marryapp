import { useState, useTransition } from "react";
import { KeyRound, Lock } from "lucide-react";
import { toast } from "sonner";
import { trocarSenha } from "@/actions/account-actions";
import { estiloDoBotao } from "@/components/landing/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { Campo, AvisoDoFormulario } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { AlternarSenha, Secao } from "./secao";

type ErrosDaSenha = { current?: string; next?: string; confirm?: string };

function conferirSenhas(current: string, next: string, confirm: string): ErrosDaSenha {
  const found: ErrosDaSenha = {};
  if (!current) found.current = "Informe a senha atual.";
  if (next.length < 8) found.next = "Use pelo menos 8 caracteres.";
  else if (next !== confirm) found.confirm = "As senhas novas não conferem.";
  return found;
}

function useTrocaDeSenha() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<ErrosDaSenha>({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const found = conferirSenhas(current, next, confirm);
    setErrors(found);
    const first = (["current", "next", "confirm"] as const).find((k) => found[k]);
    if (first) return void document.getElementById(`senha-${first}`)?.focus();
    startTransition(async () => {
      const res = await trocarSenha({ currentPassword: current, newPassword: next, confirm });
      if (!res.success) return setError(res.error);
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Senha trocada.");
    });
  };

  return { current, setCurrent, next, setNext, confirm, setConfirm, errors, error, isPending, submit };
}

export function SecaoDeSenha() {
  const t = useTrocaDeSenha();
  const [show, setShow] = useState(false);
  const tipo = show ? "text" : "password";
  return (
    <Secao id="senha" icon={KeyRound} title="Senha" description="Troque a senha de acesso. Use uma que você não usa em outros sites.">
      <form onSubmit={t.submit} noValidate className="grid gap-5 sm:grid-cols-2">
        <Campo id="senha-current" label="Senha atual" icon={Lock} error={t.errors.current} className="sm:col-span-2" trailing={<AlternarSenha show={show} onToggle={() => setShow((v) => !v)} />}>
          {(c) => <input {...c} id="senha-current" type={tipo} autoComplete="current-password" value={t.current} onChange={(e) => t.setCurrent(e.target.value)} />}
        </Campo>
        <Campo id="senha-next" label="Nova senha" icon={Lock} error={t.errors.next} hint="Pelo menos 8 caracteres.">
          {(c) => <input {...c} id="senha-next" type={tipo} autoComplete="new-password" value={t.next} onChange={(e) => t.setNext(e.target.value)} />}
        </Campo>
        <Campo id="senha-confirm" label="Repita a nova senha" icon={Lock} error={t.errors.confirm}>
          {(c) => <input {...c} id="senha-confirm" type={tipo} autoComplete="new-password" value={t.confirm} onChange={(e) => t.setConfirm(e.target.value)} />}
        </Campo>
        {t.error ? (
          <div className="sm:col-span-2">
            <AvisoDoFormulario>{t.error}</AvisoDoFormulario>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <BotaoComCarregamento type="submit" loading={t.isPending} className={cn(estiloDoBotao.primary, "min-h-12")}>
            Trocar senha
          </BotaoComCarregamento>
        </div>
      </form>
    </Secao>
  );
}
