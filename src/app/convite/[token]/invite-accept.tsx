"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Eye, EyeOff, Heart, Loader2, Lock, LogOut, Mail, TriangleAlert, User } from "lucide-react";
import { acceptInvite, acceptInviteWithNewAccount } from "@/actions/invite-actions";
import { login, logout } from "@/actions/auth-actions";
import { ShellHeading } from "@/components/account/auth-shell";
import { btn, btnArrow } from "@/components/landing/styles";
import { Field, FormAlert } from "@/app/login/fields";
import { cn } from "@/lib/utils";

export type Viewer =
  | { kind: "anonymous" }
  | { kind: "blocked"; name: string; reason: string }
  | { kind: "member"; name: string; email: string; alreadyIn: boolean };

export function InviteAccept({ token, coupleNames, viewer }: { token: string; coupleNames: string; viewer: Viewer }) {
  return (
    <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
      <span className="grid size-14 place-items-center rounded-full bg-ameixa-suave text-ameixa">
        <Heart aria-hidden="true" className="size-7" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">Você foi convidado para organizar</p>
        <ShellHeading title={coupleNames} text="Entre no casamento para ver e editar tudo junto: convidados, site, presentes e finanças." />
      </div>

      {viewer.kind === "member" ? <MemberAccept token={token} viewer={viewer} /> : null}
      {viewer.kind === "anonymous" ? <AnonymousAccept token={token} /> : null}
      {viewer.kind === "blocked" ? (
        <div className="flex flex-col gap-4">
          <FormAlert>{viewer.reason}</FormAlert>
          <p className="text-[15px] text-tinta-suave">Depois de sair, abra o link do convite de novo.</p>
          <button type="button" onClick={() => logout()} className={cn(btn.secondary, btn.block, "min-h-12")}>
            <LogOut aria-hidden="true" className="size-4" />
            Sair desta conta
          </button>
        </div>
      ) : null}
    </section>
  );
}

function MemberAccept({ token, viewer }: { token: string; viewer: Extract<Viewer, { kind: "member" }> }) {
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<{ currentCoupleNames: string; willDeleteCurrent: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const accept = (confirmLeave: boolean) => {
    setError("");
    startTransition(async () => {
      try {
        const res = await acceptInvite({ token, confirmLeave });
        if (res.success) {
          window.location.href = res.redirectTo;
          return;
        }
        if ("needsConfirm" in res) {
          setConfirm({ currentCoupleNames: res.currentCoupleNames, willDeleteCurrent: res.willDeleteCurrent });
          return;
        }
        setError(res.error);
      } catch {
        setError("Não conseguimos falar com o servidor. Tente de novo em instantes.");
      }
    });
  };

  if (viewer.alreadyIn) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-[12px] border border-linha bg-papel px-4 py-3 text-[15px] text-tinta">Você já faz parte deste casamento.</p>
        <a href="/dashboard" className={cn(btn.primary, btn.block, "min-h-12")}>
          Ir para o painel
          <ArrowRight aria-hidden="true" className={btnArrow} />
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-[12px] border border-linha bg-papel px-4 py-3 text-[15px] text-tinta-suave">
        Você está como <strong className="font-semibold text-tinta">{viewer.name}</strong> ({viewer.email}).
      </p>

      {confirm ? (
        <div role="alert" className="flex flex-col gap-3 rounded-[12px] border border-aviso/30 bg-aviso-suave px-4 py-3 text-[15px] leading-6 text-tinta">
          <p className="flex items-start gap-2 font-semibold text-aviso">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" strokeWidth={2} />
            Sua conta já faz parte de {confirm.currentCoupleNames}.
          </p>
          <p>
            {confirm.willDeleteCurrent
              ? `Ao entrar neste casamento, ${confirm.currentCoupleNames} será excluído com tudo que tem nele (convidados, site, presentes). Isso não pode ser desfeito.`
              : `Ao entrar neste casamento, você sai de ${confirm.currentCoupleNames}. Quem continua lá não perde nada.`}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => accept(true)} disabled={isPending} className={cn(btn.primary, "min-h-11 flex-1")}>
              {isPending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
              Entendi, entrar mesmo assim
            </button>
            <button type="button" onClick={() => setConfirm(null)} disabled={isPending} className={cn(btn.secondary, "min-h-11")}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => accept(false)} disabled={isPending} className={cn(btn.primary, btn.block, "min-h-12")}>
          {isPending ? (
            <>
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              Entrando…
            </>
          ) : (
            <>
              Entrar neste casamento
              <ArrowRight aria-hidden="true" className={btnArrow} />
            </>
          )}
        </button>
      )}

      {error ? <FormAlert>{error}</FormAlert> : null}

      <button type="button" onClick={() => logout()} className={cn(btn.quiet, "self-center")}>
        Não é você? Sair
      </button>
    </div>
  );
}

function AnonymousAccept({ token }: { token: string }) {
  const [mode, setMode] = useState<"criar" | "entrar">("criar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "password", string>>>({});
  const [error, setError] = useState<{ message: string; existingAccount?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const switchMode = (to: "criar" | "entrar") => {
    setMode(to);
    setErrors({});
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const found: typeof errors = {};
    if (mode === "criar" && name.trim().length < 3) found.name = "Informe seu nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) found.email = "Confira o e-mail.";
    if (mode === "criar" ? password.length < 8 : password.length === 0) {
      found.password = mode === "criar" ? "Use pelo menos 8 caracteres." : "Informe sua senha.";
    }
    setErrors(found);
    const first = (["name", "email", "password"] as const).find((k) => found[k]);
    if (first) {
      document.getElementById(`convite-${first}`)?.focus();
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "criar") {
          const res = await acceptInviteWithNewAccount({ token, name, email: email.trim().toLowerCase(), password });
          if (res.success) {
            window.location.href = res.redirectTo;
            return;
          }
          setError({ message: res.error, existingAccount: "existingAccount" in res ? res.existingAccount : false });
          return;
        }
        const res = await login(password, email.trim().toLowerCase());
        if (!res.success) {
          setError({ message: res.error || "E-mail ou senha não conferem." });
          return;
        }
        // Com a sessão criada, a página volta mostrando "Entrar neste casamento".
        window.location.reload();
      } catch {
        setError({ message: "Não conseguimos falar com o servidor. Tente de novo em instantes." });
      }
    });
  };

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
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Como continuar" className="grid grid-cols-2 gap-1 rounded-[12px] bg-areia p-1">
        {(
          [
            ["criar", "Criar minha conta"],
            ["entrar", "Já tenho conta"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => switchMode(key)}
            className={cn(
              "flex min-h-11 cursor-pointer items-center justify-center rounded-[10px] font-semibold transition-[background-color,color,box-shadow] duration-300 ease-[var(--ease-aceito)]",
              mode === key ? "bg-papel text-tinta shadow-[var(--shadow-aceito-1)]" : "text-tinta-suave hover:bg-papel/60 hover:text-tinta",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {mode === "criar" ? (
          <Field id="convite-name" label="Seu nome completo" icon={User} error={errors.name}>
            {(c) => <input {...c} id="convite-name" autoComplete="name" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />}
          </Field>
        ) : null}
        <Field id="convite-email" label="E-mail" icon={Mail} error={errors.email}>
          {(c) => (
            <input
              {...c}
              id="convite-email"
              type="email"
              autoComplete={mode === "criar" ? "email" : "username"}
              autoCapitalize="none"
              spellCheck={false}
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
        <Field
          id="convite-password"
          label={mode === "criar" ? "Crie uma senha" : "Senha"}
          icon={Lock}
          error={errors.password}
          hint={mode === "criar" ? "Pelo menos 8 caracteres." : undefined}
          trailing={toggle}
        >
          {(c) => (
            <input
              {...c}
              id="convite-password"
              type={show ? "text" : "password"}
              autoComplete={mode === "criar" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>

        {error ? (
          <FormAlert>
            <p>{error.message}</p>
            {error.existingAccount ? (
              <button type="button" onClick={() => switchMode("entrar")} className="mt-1 font-semibold text-ameixa underline underline-offset-4">
                Entrar com este e-mail
              </button>
            ) : null}
          </FormAlert>
        ) : null}

        <button type="submit" disabled={isPending} className={cn(btn.primary, btn.block, "min-h-12")}>
          {isPending ? (
            <>
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              {mode === "criar" ? "Criando a conta…" : "Entrando…"}
            </>
          ) : (
            <>
              {mode === "criar" ? "Criar conta e entrar no casamento" : "Entrar"}
              <ArrowRight aria-hidden="true" className={btnArrow} />
            </>
          )}
        </button>

        {mode === "criar" ? (
          <p className="text-center text-sm leading-5 text-tinta-suave">
            Ao criar a conta, você concorda com os{" "}
            <a href="/termos" target="_blank" className="font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4">
              termos de uso
            </a>{" "}
            e a{" "}
            <a href="/privacidade" target="_blank" className="font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4">
              política de privacidade
            </a>
            .
          </p>
        ) : (
          <a href="/esqueci-a-senha" className={cn(btn.quiet, "self-center")}>
            Esqueci a senha
          </a>
        )}
      </form>
    </div>
  );
}
