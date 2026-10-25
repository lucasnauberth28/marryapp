"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Mail, MailCheck } from "lucide-react";
import { pedirRedefinicaoDeSenha } from "@/actions/password-reset-actions";
import { TituloDoMolde } from "@/components/account/auth-shell";
import { estiloDoBotao, estiloDoBotaoComSeta } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { Campo, AvisoDoFormulario } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type TituloRef = React.RefObject<HTMLHeadingElement | null>;

function usePedidoDeRedefinicao(titulo: TituloRef) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFieldError("Confira o e-mail.");
      return void document.getElementById("esqueci-email")?.focus();
    }
    setFieldError("");
    startTransition(async () => {
      try {
        const res = await pedirRedefinicaoDeSenha({ email: value });
        if (!res.success) return setError(res.error);
        setSent(res.message);
        requestAnimationFrame(() => titulo.current?.focus({ preventScroll: true }));
      } catch {
        setError("Não conseguimos falar com o servidor. Tente de novo em instantes.");
      }
    });
  };

  return { email, setEmail, error, fieldError, sent, setSent, isPending, handleSubmit };
}

function LinkEnviado({ titulo, mensagem, aoUsarOutro }: { titulo: TituloRef; mensagem: string; aoUsarOutro: () => void }) {
  return (
    <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
      <span className="grid size-14 place-items-center rounded-full bg-ameixa-suave text-ameixa">
        <MailCheck aria-hidden="true" className="size-7" strokeWidth={1.6} />
      </span>
      <TituloDoMolde ref={titulo} title="Confira seu e-mail" text={mensagem} />
      <Link href="/login" className={cn(estiloDoBotao.secondary, estiloDoBotao.block, "min-h-12")}>
        Voltar para o login
      </Link>
      <button type="button" onClick={aoUsarOutro} className={cn(estiloDoBotao.quiet, "self-center")}>
        Usar outro e-mail
      </button>
    </section>
  );
}

export function FormularioDeEsqueciASenha() {
  const titulo = useRef<HTMLHeadingElement>(null);
  const f = usePedidoDeRedefinicao(titulo);

  if (f.sent) return <LinkEnviado titulo={titulo} mensagem={f.sent} aoUsarOutro={() => f.setSent(null)} />;

  return (
    <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
      <TituloDoMolde ref={titulo} title="Esqueceu a senha?" text="Informe o e-mail da conta. Enviamos um link para você criar uma senha nova." />
      <form onSubmit={f.handleSubmit} noValidate className="flex flex-col gap-5">
        <Campo id="esqueci-email" label="E-mail" icon={Mail} error={f.fieldError}>
          {(c) => <input {...c} id="esqueci-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="voce@email.com" value={f.email} onChange={(e) => f.setEmail(e.target.value)} />}
        </Campo>
        {f.error ? <AvisoDoFormulario>{f.error}</AvisoDoFormulario> : null}
        <Botao type="submit" loading={f.isPending} className="h-12 w-full rounded-[12px] px-6">
          Enviar link
          <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
        </Botao>
      </form>
    </section>
  );
}
