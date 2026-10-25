"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { entrar } from "@/actions/auth-actions";
import { estiloDoBotaoComSeta } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";

import { AvisoDoFormulario } from "@/components/ui/field";
import { Entrada } from "@/components/ui/input";

export function FormularioDeLogin({
  initialEmail = "",
  nextPath = null,
  onCreateAccount,
}: {
  initialEmail?: string;
  nextPath?: string | null;
  onCreateAccount: () => void;
}) {
  const [username, setUsername] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await entrar(password, username, nextPath ?? undefined);
      if (res.success) {
        window.location.href = ("redirectTo" in res && res.redirectTo) || "/dashboard";
      } else {
        setError(res.error || "E-mail ou senha não conferem. Confira e tente de novo.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : "Não conseguimos falar com o servidor. Tente de novo em instantes.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate={false} className="flex flex-col gap-5" aria-describedby={error ? "login-erro" : undefined}>
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
        value={username}
        onChange={(e) => setUsername(e.target.value.toLowerCase())}
        invalid={Boolean(error)}
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          invalid={Boolean(error)}
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              className="grid size-11 cursor-pointer place-items-center rounded-[10px] text-tinta-suave transition-colors duration-200 hover:bg-areia hover:text-tinta"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-[18px]" strokeWidth={1.6} />
              ) : (
                <Eye aria-hidden="true" className="size-[18px]" strokeWidth={1.6} />
              )}
            </button>
          }
        />
        <Link
          href="/esqueci-a-senha"
          className="inline-flex min-h-11 items-center self-end text-sm font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 transition-colors hover:decoration-ameixa"
        >
          Esqueci a senha
        </Link>
      </div>

      {error ? <AvisoDoFormulario id="login-erro">{error}</AvisoDoFormulario> : null}

      <Botao type="submit" loading={isLoading} className="mt-1 h-12 w-full rounded-[12px] px-6">
        Entrar
        <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
      </Botao>

      <p className="text-center text-[15px] text-tinta-suave">
        Ainda não tem conta?{" "}
        <button
          type="button"
          onClick={onCreateAccount}
          className="cursor-pointer font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 transition-colors hover:decoration-ameixa"
        >
          Criar minha conta
        </button>
      </p>
    </form>
  );
}
