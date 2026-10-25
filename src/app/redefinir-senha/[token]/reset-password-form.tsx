"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { redefinirSenha } from "@/actions/password-reset-actions";
import { TituloDoMolde } from "@/components/account/auth-shell";
import { AlternarVisibilidadeDaSenha } from "@/components/account/password-toggle";
import { estiloDoBotao, estiloDoBotaoComSeta } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { Campo, AvisoDoFormulario } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type TituloRef = React.RefObject<HTMLHeadingElement | null>;
type ErroGeral = { message: string; expired?: boolean };

function useRedefinicaoDeSenha(token: string, titulo: TituloRef) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [error, setError] = useState<ErroGeral | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const found: typeof errors = {};
    if (password.length < 8) found.password = "Use pelo menos 8 caracteres.";
    else if (confirm !== password) found.confirm = "As senhas não conferem.";
    setErrors(found);
    if (found.password) return void document.getElementById("nova-senha")?.focus();
    if (found.confirm) return void document.getElementById("nova-senha-confirmar")?.focus();

    startTransition(async () => {
      try {
        const res = await redefinirSenha({ token, password, confirm });
        if (!res.success) return setError({ message: res.error, expired: res.expired });
        setDone(true);
        requestAnimationFrame(() => titulo.current?.focus({ preventScroll: true }));
      } catch {
        setError({ message: "Não conseguimos falar com o servidor. Tente de novo em instantes." });
      }
    });
  };

  return { password, setPassword, confirm, setConfirm, errors, error, done, isPending, handleSubmit };
}

function SenhaTrocada({ titulo }: { titulo: TituloRef }) {
  return (
    <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
      <span className="grid size-14 place-items-center rounded-full bg-sucesso-suave text-sucesso">
        <CheckCircle2 aria-hidden="true" className="size-7" strokeWidth={1.6} />
      </span>
      <TituloDoMolde ref={titulo} title="Senha trocada" text="Pronto. Agora é só entrar com a senha nova." />
      <Link href="/login" className={cn(estiloDoBotao.primary, estiloDoBotao.block, "min-h-12")}>
        Entrar
        <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
      </Link>
    </section>
  );
}

export function FormularioDeRedefinicaoDeSenha({ token }: { token: string }) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const f = useRedefinicaoDeSenha(token, titulo);
  const [show, setShow] = useState(false);
  const tipo = show ? "text" : "password";

  if (f.done) return <SenhaTrocada titulo={titulo} />;

  return (
    <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
      <TituloDoMolde ref={titulo} title="Crie uma nova senha" text="Escolha uma senha que você não usa em outros sites." />
      <form onSubmit={f.handleSubmit} noValidate className="flex flex-col gap-5">
        <Campo id="nova-senha" label="Nova senha" icon={Lock} error={f.errors.password} hint="Pelo menos 8 caracteres." trailing={<AlternarVisibilidadeDaSenha show={show} onToggle={() => setShow((v) => !v)} />}>
          {(c) => <input {...c} id="nova-senha" type={tipo} autoComplete="new-password" value={f.password} onChange={(e) => f.setPassword(e.target.value)} />}
        </Campo>
        <Campo id="nova-senha-confirmar" label="Repita a nova senha" icon={Lock} error={f.errors.confirm}>
          {(c) => <input {...c} id="nova-senha-confirmar" type={tipo} autoComplete="new-password" value={f.confirm} onChange={(e) => f.setConfirm(e.target.value)} />}
        </Campo>
        {f.error ? (
          <AvisoDoFormulario>
            <p>{f.error.message}</p>
            {f.error.expired ? (
              <Link href="/esqueci-a-senha" className="mt-1 inline-block font-semibold text-ameixa underline underline-offset-4">
                Pedir um novo link
              </Link>
            ) : null}
          </AvisoDoFormulario>
        ) : null}
        <Botao type="submit" loading={f.isPending} className="h-12 w-full rounded-[12px] px-6">
          Salvar nova senha
          <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
        </Botao>
      </form>
    </section>
  );
}
