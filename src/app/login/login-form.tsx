"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { entrar } from "@/actions/auth-actions";
import { BotaoDoGoogle, SeparadorOu } from "@/components/account/botao-do-google";
import { AlternarVisibilidadeDaSenha } from "@/components/account/password-toggle";
import { estiloDoBotaoComSeta } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { AvisoDoFormulario } from "@/components/ui/field";
import { Entrada } from "@/components/ui/input";

function useEntrada(initialEmail: string, nextPath: string | null) {
  const [username, setUsername] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await entrar(password, username, nextPath ?? undefined);
      if (res.success) window.location.href = ("redirectTo" in res && res.redirectTo) || "/dashboard";
      else setError(res.error || "E-mail ou senha não conferem. Confira e tente de novo.");
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : "Não conseguimos falar com o servidor. Tente de novo em instantes.");
    } finally {
      setIsLoading(false);
    }
  };

  return { username, setUsername, password, setPassword, error, isLoading, handleSubmit };
}

function CamposDeLogin({ f }: { f: ReturnType<typeof useEntrada> }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <>
    <Entrada
      id="login-email"
      name="email"
      type="text"
      inputMode="email"
      autoComplete="username"
      autoCapitalize="none"
      spellCheck={false}
      label="E-mail"
      icon={Mail}
      placeholder="voce@email.com"
      value={f.username}
      onChange={(e) => f.setUsername(e.target.value.toLowerCase())}
      invalid={Boolean(f.error)}
      required
    />

    <div className="flex flex-col gap-1">
      <Entrada
        id="login-senha"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        label="Senha"
        icon={Lock}
        value={f.password}
        onChange={(e) => f.setPassword(e.target.value)}
        invalid={Boolean(f.error)}
        required
        trailing={<AlternarVisibilidadeDaSenha show={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
      />
      <Link href="/esqueci-a-senha" className="inline-flex min-h-11 items-center self-end text-sm font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 transition-colors hover:decoration-ameixa">
        Esqueci a senha
      </Link>
    </div>
    </>
  );
}

export function FormularioDeLogin({
  initialEmail = "",
  nextPath = null,
  onCreateAccount,
  googleAtivo = false,
}: {
  initialEmail?: string;
  nextPath?: string | null;
  onCreateAccount: () => void;
  /** As credenciais do Google estão configuradas: mostra "Continuar com o Google". */
  googleAtivo?: boolean;
}) {
  const f = useEntrada(initialEmail, nextPath);
  return (
    <div className="flex flex-col gap-5">
      {googleAtivo ? (
        <>
          <BotaoDoGoogle modo="entrar" parametros={{ proxima: nextPath }} />
          <SeparadorOu />
        </>
      ) : null}
    <form onSubmit={f.handleSubmit} noValidate={false} className="flex flex-col gap-5" aria-describedby={f.error ? "login-erro" : undefined}>
      <CamposDeLogin f={f} />

      {f.error ? <AvisoDoFormulario id="login-erro">{f.error}</AvisoDoFormulario> : null}

      <Botao type="submit" loading={f.isLoading} className="mt-1 h-12 w-full rounded-[12px] px-6">
        Entrar
        <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
      </Botao>

      <p className="text-center text-[15px] text-tinta-suave">
        Ainda não tem conta?{" "}
        <button type="button" onClick={onCreateAccount} className="cursor-pointer font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 transition-colors hover:decoration-ameixa">
          Criar minha conta
        </button>
      </p>
    </form>
    </div>
  );
}
