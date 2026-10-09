"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { resetPassword } from "@/actions/password-reset-actions";
import { ShellHeading } from "@/components/account/auth-shell";
import { btn, btnArrow } from "@/components/landing/styles";
import { Field, FormAlert } from "@/app/login/fields";
import { cn } from "@/lib/utils";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [error, setError] = useState<{ message: string; expired?: boolean } | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const found: typeof errors = {};
    if (password.length < 8) found.password = "Use pelo menos 8 caracteres.";
    else if (confirm !== password) found.confirm = "As senhas não conferem.";
    setErrors(found);
    if (found.password) return document.getElementById("nova-senha")?.focus();
    if (found.confirm) return document.getElementById("nova-senha-confirmar")?.focus();

    startTransition(async () => {
      try {
        const res = await resetPassword({ token, password, confirm });
        if (!res.success) {
          setError({ message: res.error, expired: res.expired });
          return;
        }
        setDone(true);
        requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
      } catch {
        setError({ message: "Não conseguimos falar com o servidor. Tente de novo em instantes." });
      }
    });
  };

  if (done) {
    return (
      <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
        <span className="grid size-14 place-items-center rounded-full bg-sucesso-suave text-sucesso">
          <CheckCircle2 aria-hidden="true" className="size-7" strokeWidth={1.75} />
        </span>
        <ShellHeading ref={headingRef} title="Senha trocada" text="Pronto. Agora é só entrar com a senha nova." />
        <Link href="/login" className={cn(btn.primary, btn.block, "min-h-12")}>
          Entrar
          <ArrowRight aria-hidden="true" className={btnArrow} />
        </Link>
      </section>
    );
  }

  const toggle = (
    <button
      type="button"
      onClick={() => setShow((v) => !v)}
      aria-label={show ? "Ocultar senha" : "Mostrar senha"}
      aria-pressed={show}
      className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-[10px] text-tinta-suave transition-colors hover:bg-areia hover:text-tinta"
    >
      {show ? <EyeOff aria-hidden="true" className="size-[18px]" strokeWidth={1.75} /> : <Eye aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />}
    </button>
  );

  return (
    <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
      <ShellHeading ref={headingRef} title="Crie uma nova senha" text="Escolha uma senha que você não usa em outros sites." />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Field id="nova-senha" label="Nova senha" icon={Lock} error={errors.password} hint="Pelo menos 8 caracteres." trailing={toggle}>
          {(c) => (
            <input
              {...c}
              id="nova-senha"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        <Field id="nova-senha-confirmar" label="Repita a nova senha" icon={Lock} error={errors.confirm}>
          {(c) => (
            <input
              {...c}
              id="nova-senha-confirmar"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}
        </Field>
        {error ? (
          <FormAlert>
            <p>{error.message}</p>
            {error.expired ? (
              <Link href="/esqueci-a-senha" className="mt-1 inline-block font-semibold text-ameixa underline underline-offset-4">
                Pedir um novo link
              </Link>
            ) : null}
          </FormAlert>
        ) : null}
        <button type="submit" disabled={isPending} className={cn(btn.primary, btn.block, "min-h-12")}>
          {isPending ? (
            <>
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              Salvando…
            </>
          ) : (
            <>
              Salvar nova senha
              <ArrowRight aria-hidden="true" className={btnArrow} />
            </>
          )}
        </button>
      </form>
    </section>
  );
}
