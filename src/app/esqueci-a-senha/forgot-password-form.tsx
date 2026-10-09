"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Mail, MailCheck } from "lucide-react";
import { requestPasswordReset } from "@/actions/password-reset-actions";
import { ShellHeading } from "@/components/account/auth-shell";
import { btn, btnArrow } from "@/components/landing/styles";
import { Field, FormAlert } from "@/app/login/fields";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFieldError("Confira o e-mail.");
      document.getElementById("esqueci-email")?.focus();
      return;
    }
    setFieldError("");
    startTransition(async () => {
      try {
        const res = await requestPasswordReset({ email: value });
        if (!res.success) {
          setError(res.error);
          return;
        }
        setSent(res.message);
        requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
      } catch {
        setError("Não conseguimos falar com o servidor. Tente de novo em instantes.");
      }
    });
  };

  if (sent) {
    return (
      <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
        <span className="grid size-14 place-items-center rounded-full bg-ameixa-suave text-ameixa">
          <MailCheck aria-hidden="true" className="size-7" strokeWidth={1.75} />
        </span>
        <ShellHeading ref={headingRef} title="Confira seu e-mail" text={sent} />
        <Link href="/login" className={cn(btn.secondary, btn.block, "min-h-12")}>
          Voltar para o login
        </Link>
        <button type="button" onClick={() => setSent(null)} className={cn(btn.quiet, "self-center")}>
          Usar outro e-mail
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
      <ShellHeading ref={headingRef} title="Esqueceu a senha?" text="Informe o e-mail da conta. Enviamos um link para você criar uma senha nova." />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Field id="esqueci-email" label="E-mail" icon={Mail} error={fieldError}>
          {(c) => (
            <input
              {...c}
              id="esqueci-email"
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
        {error ? <FormAlert>{error}</FormAlert> : null}
        <button type="submit" disabled={isPending} className={cn(btn.primary, btn.block, "min-h-12")}>
          {isPending ? (
            <>
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              Enviar link
              <ArrowRight aria-hidden="true" className={btnArrow} />
            </>
          )}
        </button>
      </form>
    </section>
  );
}
