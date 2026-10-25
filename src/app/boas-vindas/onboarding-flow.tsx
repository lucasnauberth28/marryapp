"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowRight, CalendarHeart, Check, Copy, Globe, Heart, Palette, User } from "lucide-react";
import { completeOnboarding } from "@/actions/onboarding-actions";
import { AuthShell, SHELL_PHOTOS, ShellHeading } from "@/components/account/auth-shell";
import { Seal } from "@/components/landing/seal";
import { btn, btnArrow } from "@/components/landing/styles";
import { LoadingButton } from "@/components/painel/loading-button";
import { Field, FormAlert } from "@/components/ui/field";
import { juntarNomesDoCasal, validarDadosBasicosDoInicio, type ErrosDosDadosBasicosDoInicio } from "@/lib/onboarding-options";
import { cn } from "@/lib/utils";

type Step = "dados" | "pronto";

interface Initial {
  yourName: string;
  partnerName: string;
  weddingDate: string | null;
}

/**
 * Uma tela só: nomes e data (a data é opcional). Cidade, faixa de convidados e cor do site não são
 * mais perguntadas aqui; a cor e o local ficam em Editar o site, quando o casal for preparar o site.
 */
export function OnboardingFlow({
  firstName,
  initial,
  done,
}: {
  firstName: string;
  initial: Initial;
  /** Casamento recém-configurado: abre direto na tela final. */
  done: { slug: string; coupleNames: string } | null;
}) {
  const [step, setStep] = useState<Step>(done ? "pronto" : "dados");
  const [yourName, setYourName] = useState(initial.yourName);
  const [partnerName, setPartnerName] = useState(initial.partnerName);
  const [weddingDate, setWeddingDate] = useState(initial.weddingDate ?? "");

  const [errors, setErrors] = useState<ErrosDosDadosBasicosDoInicio>({});
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ slug: string; coupleNames: string } | null>(done);
  const [copied, setCopied] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const coupleNames = juntarNomesDoCasal(yourName, partnerName) || "Vocês dois";
  // O erro some assim que a pessoa mexe no campo a que ele se refere.
  const edit = (key: keyof ErrosDosDadosBasicosDoInicio, set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set(e.target.value);
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const found = validarDadosBasicosDoInicio({ yourName, partnerName, weddingDate });
    setErrors(found);
    const first = (["yourName", "partnerName", "weddingDate"] as const).find((k) => found[k]);
    if (first) return document.getElementById(`onb-${first}`)?.focus();

    startTransition(async () => {
      const res = await completeOnboarding({ yourName, partnerName, weddingDate: weddingDate || null });
      if (!res.success) {
        if (res.redirectTo) {
          window.location.href = res.redirectTo;
          return;
        }
        setFormError(res.error);
        return;
      }
      setResult({ slug: res.slug, coupleNames: res.coupleNames });
      setStep("pronto");
    });
  };

  const sitePath = result ? `/casamento/${result.slug}` : "";
  // "pronto" só aparece depois de uma ação no navegador: não há renderização no servidor aqui.
  const origin = result && typeof window !== "undefined" ? window.location.origin : "";
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(`${origin}${sitePath}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AuthShell
      photo={step === "pronto" ? SHELL_PHOTOS.pronto : SHELL_PHOTOS.boasVindas}
      footnote="Nomes e data podem ser alterados depois, em Editar o site."
    >
      {step === "dados" ? (
        <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
          <ShellHeading
            ref={headingRef}
            overline="Vamos começar"
            title="Quem vai casar, e quando?"
            text={`${firstName ? `Boas-vindas, ${firstName}. ` : ""}É só isso para abrir o site de vocês. Cor, local e fotos ficam para depois, em Editar o site.`}
          />
          <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <Field id="onb-yourName" label="Seu nome" icon={User} error={errors.yourName}>
              {(c) => (
                <input {...c} id="onb-yourName" autoComplete="given-name" maxLength={60} value={yourName} onChange={edit("yourName", setYourName)} />
              )}
            </Field>
            <Field id="onb-partnerName" label="Nome de quem vai casar com você" icon={Heart} error={errors.partnerName}>
              {(c) => (
                <input {...c} id="onb-partnerName" autoComplete="off" maxLength={60} value={partnerName} onChange={edit("partnerName", setPartnerName)} />
              )}
            </Field>
            <Field
              id="onb-weddingDate"
              label="Data do casamento"
              icon={CalendarHeart}
              optional
              error={errors.weddingDate}
              hint="Se ainda não têm a data, deixem em branco."
            >
              {(c) => <input {...c} id="onb-weddingDate" type="date" value={weddingDate} onChange={edit("weddingDate", setWeddingDate)} />}
            </Field>
            <p className="rounded-[12px] border border-linha bg-papel px-4 py-3 text-[15px] text-tinta-suave">
              No site vai aparecer <strong className="font-display text-lg font-medium text-tinta">{coupleNames}</strong>
            </p>

            {formError ? <FormAlert id="onb-erro">{formError}</FormAlert> : null}

            <LoadingButton type="submit" loading={isPending} className={cn(btn.primary, btn.block, "min-h-12")}>
              Criar o site de vocês
              <ArrowRight aria-hidden="true" className={btnArrow} />
            </LoadingButton>
          </form>
        </section>
      ) : null}

      {step === "pronto" && result ? (
        <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
          <Seal label="Casamento criado" className="size-24 [&>span]:text-[54px]" />
          <ShellHeading ref={headingRef} title="Tudo pronto" text={`O site de ${result.coupleNames} já tem um endereço no Aceito.`} />

          <div className="flex flex-col gap-2 rounded-[16px] border border-linha bg-papel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">Endereço do site no Aceito</p>
            <div className="flex items-center gap-2">
              <Globe aria-hidden="true" className="size-[18px] shrink-0 text-ameixa" strokeWidth={1.6} />
              <a href={sitePath} target="_blank" rel="noopener" className="min-w-0 flex-1 break-all font-semibold text-tinta underline decoration-linha underline-offset-4 hover:decoration-ameixa">
                {origin ? `${origin.replace(/^https?:\/\//, "")}${sitePath}` : sitePath}
              </a>
              <button type="button" onClick={copyAddress} className={cn(btn.quiet, btn.sm, "min-h-11 shrink-0")}>
                {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="text-sm text-tinta-suave" aria-live="polite">
              {copied ? "Link copiado." : "Compartilhem o endereço quando o site estiver do jeito de vocês."}
            </p>
          </div>

          {/* Navegação completa: o painel precisa ler o cookie de sessão atualizado no onboarding. */}
          <div className="flex flex-col gap-3">
            <a href="/dashboard" className={cn(btn.primary, btn.block, "min-h-12")}>
              Ir para o painel
              <ArrowRight aria-hidden="true" className={btnArrow} />
            </a>
            <a href="/site-builder" className={cn(btn.secondary, btn.block, "min-h-12")}>
              <Palette aria-hidden="true" className="size-4" />
              Escolher cor e fotos do site
            </a>
          </div>
        </section>
      ) : null}
    </AuthShell>
  );
}
