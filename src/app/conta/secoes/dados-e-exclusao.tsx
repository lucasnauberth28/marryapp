import { useState, useTransition } from "react";
import { Download, Lock, ShieldCheck, Trash2 } from "lucide-react";
import { excluirMinhaConta } from "@/actions/account-actions";
import { estiloDoBotao } from "@/components/landing/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { Campo, AvisoDoFormulario } from "@/components/ui/field";
import { formatarDataBrasiliaLonga } from "@/lib/formatacao/data";
import { cn } from "@/lib/utils";
import { AlternarVisibilidadeDaSenha } from "@/components/account/password-toggle";
import { Secao } from "./secao";
import type { TipoDeConta } from "./tipos";

interface PropriedadesDosDados {
  kind: TipoDeConta;
  createdAt: string;
  companyName: string | null;
  coupleNames: string | null;
}

export function SecaoDeDados({ kind, createdAt, companyName, coupleNames }: PropriedadesDosDados) {
  const what =
    kind === "vendor"
      ? `seu perfil${companyName ? ` (${companyName})` : ""}, pedidos de orçamento, avaliações e agenda`
      : coupleNames
        ? `o casamento ${coupleNames}: convidados, site, presentes, finanças e tarefas`
        : "os dados da sua conta";

  return (
    <Secao id="dados" icon={ShieldCheck} title="Seus dados" description={<>Conta criada em {formatarDataBrasiliaLonga(new Date(createdAt))}. Baixe uma cópia de tudo o que guardamos: dados da conta e {what}.</>}>
      <div className="flex flex-wrap items-center gap-3">
        <a href="/api/conta/exportar" download className={cn(estiloDoBotao.secondary, "min-h-12")}>
          <Download aria-hidden="true" className="size-4" />
          Baixar meus dados (JSON)
        </a>
        <a href="/privacidade" target="_blank" className="text-[15px] font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 hover:decoration-ameixa">
          Política de privacidade
        </a>
      </div>
    </Secao>
  );
}

function consequenciaDaExclusao(kind: TipoDeConta, isLastMember: boolean) {
  if (kind === "vendor") return "Seu perfil sai da vitrine e os pedidos, avaliações e a agenda são apagados.";
  if (isLastMember) return "Você é a única pessoa no casamento: ele será apagado junto, com convidados, site, presentes e finanças.";
  return "O casamento continua com quem mais organiza; só a sua conta sai.";
}

function FormularioDeExclusao({ aoCancelar }: { aoCancelar: () => void }) {
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const ready = confirmation.trim().toUpperCase() === "EXCLUIR" && password.length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setError("");
    startTransition(async () => {
      const res = await excluirMinhaConta({ confirmation, password });
      if (!res.success) return setError(res.error);
      window.location.href = "/";
    });
  };

  return (
    <form onSubmit={submit} noValidate className="step-in grid gap-5 sm:grid-cols-2">
      <Campo id="excluir-confirmacao" label='Digite "EXCLUIR" para confirmar'>
        {(c) => <input {...c} id="excluir-confirmacao" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />}
      </Campo>
      <Campo id="excluir-senha" label="Sua senha" icon={Lock} trailing={<AlternarVisibilidadeDaSenha show={show} onToggle={() => setShow((v) => !v)} varias />}>
        {(c) => <input {...c} id="excluir-senha" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
      </Campo>
      {error ? (
        <div className="sm:col-span-2">
          <AvisoDoFormulario>{error}</AvisoDoFormulario>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <BotaoComCarregamento type="submit" loading={isPending} disabled={!ready} className={cn(estiloDoBotao.primary, "min-h-12 bg-perigo hover:bg-perigo/90 hover:shadow-none")}>
          <Trash2 aria-hidden="true" className="size-4" />
          Excluir minha conta
        </BotaoComCarregamento>
        <button type="button" onClick={aoCancelar} className={cn(estiloDoBotao.quiet, "min-h-12")}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function SecaoDeExclusao({ kind, isLastMember }: { kind: TipoDeConta; isLastMember: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Secao id="excluir" icon={Trash2} tone="danger" title="Excluir conta" description={`Apaga a sua conta de vez. ${consequenciaDaExclusao(kind, isLastMember)} Não dá para desfazer.`}>
      {open ? (
        <FormularioDeExclusao aoCancelar={() => setOpen(false)} />
      ) : (
        <div>
          <button type="button" onClick={() => setOpen(true)} className={cn(estiloDoBotao.secondary, "min-h-12 text-perigo hover:border-perigo hover:bg-perigo-suave")}>
            Quero excluir minha conta
          </button>
        </div>
      )}
    </Secao>
  );
}
