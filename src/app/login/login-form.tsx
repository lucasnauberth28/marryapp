"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { login } from "@/actions/auth-actions";
import { btn, btnArrow } from "@/components/landing/styles";
import { cn } from "@/lib/utils";

const field =
  "peer block min-h-12 w-full rounded-[12px] border border-linha-forte bg-papel pl-11 pr-4 text-base leading-6 text-tinta transition-[border-color,box-shadow] duration-200 placeholder:text-tinta-suave/80 hover:border-tinta-suave focus:border-ameixa focus:shadow-[0_0_0_3px_var(--color-ameixa-suave)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa aria-[invalid=true]:border-2 aria-[invalid=true]:border-perigo";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await login(password, username);
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
      <div className="flex flex-col gap-2">
        <label htmlFor="login-email" className="text-sm font-semibold leading-5 text-tinta">
          E-mail
        </label>
        <div className="relative">
          <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-tinta-suave" strokeWidth={1.75} />
          <input
            id="login-email"
            name="email"
            type="text"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="voce@email.com"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            aria-invalid={error ? true : undefined}
            className={field}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="login-senha" className="text-sm font-semibold leading-5 text-tinta">
          Senha
        </label>
        <div className="relative">
          <Lock aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-tinta-suave" strokeWidth={1.75} />
          <input
            id="login-senha"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? true : undefined}
            className={cn(field, "pr-12")}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-[10px] text-tinta-suave transition-colors duration-200 hover:bg-areia hover:text-tinta"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
            ) : (
              <Eye aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {error ? (
        <p
          id="login-erro"
          role="alert"
          className="flex items-start gap-2.5 rounded-[12px] border border-perigo/25 bg-perigo-suave px-4 py-3 text-sm font-semibold leading-5 text-perigo"
        >
          <CircleAlert aria-hidden="true" className="mt-px size-[18px] shrink-0" strokeWidth={2} />
          <span>{error}</span>
        </p>
      ) : null}

      <button type="submit" disabled={isLoading} className={cn(btn.primary, btn.block, "mt-1 min-h-12")}>
        {isLoading ? (
          <>
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Entrando…
          </>
        ) : (
          <>
            Entrar
            <ArrowRight aria-hidden="true" className={btnArrow} />
          </>
        )}
      </button>

      <p className="text-center text-[15px] text-tinta-suave">
        Ainda não tem conta?{" "}
        <Link
          href="/assinar"
          className="font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 transition-colors hover:decoration-ameixa"
        >
          Criar meu casamento
        </Link>
      </p>
    </form>
  );
}
