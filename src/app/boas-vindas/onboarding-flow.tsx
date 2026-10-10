"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarHeart,
  Check,
  CheckCircle2,
  Copy,
  Globe,
  Heart,
  LayoutDashboard,
  Loader2,
  MapPin,
  Palette,
  User,
  Users,
} from "lucide-react";
import { completeOnboarding } from "@/actions/onboarding-actions";
import { AuthShell, SHELL_PHOTOS, ShellHeading } from "@/components/account/auth-shell";
import { btn, btnArrow } from "@/components/landing/styles";
import { Field, FormAlert } from "@/app/login/fields";
import { GUEST_RANGES, THEME_PRESETS, joinCoupleNames, type GuestRange } from "@/lib/onboarding-options";
import { cn } from "@/lib/utils";

type Step = "nomes" | "data" | "cidade" | "convidados" | "cor" | "pronto";
const STEPS: Exclude<Step, "pronto">[] = ["nomes", "data", "cidade", "convidados", "cor"];

interface Initial {
  yourName: string;
  partnerName: string;
  weddingDate: string | null;
  city: string;
  guestEstimate: GuestRange | null;
  themeColor: string;
}

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
  const [step, setStep] = useState<Step>(done ? "pronto" : "nomes");
  const [yourName, setYourName] = useState(initial.yourName);
  const [partnerName, setPartnerName] = useState(initial.partnerName);
  const [weddingDate, setWeddingDate] = useState(initial.weddingDate ?? "");
  const [noDateYet, setNoDateYet] = useState(false);
  const [city, setCity] = useState(initial.city);
  const [guestEstimate, setGuestEstimate] = useState<GuestRange | null>(initial.guestEstimate);
  const [themeColor, setThemeColor] = useState(initial.themeColor);

  const [errors, setErrors] = useState<Partial<Record<"yourName" | "partnerName" | "date", string>>>({});
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

  const coupleNames = joinCoupleNames(yourName, partnerName) || "Vocês dois";
  const index = STEPS.indexOf(step as Exclude<Step, "pronto">);
  const go = (to: Step) => {
    setFormError("");
    setStep(to);
  };
  const next = () => go(STEPS[index + 1] ?? "cor");
  const back = () => go(STEPS[index - 1] ?? "nomes");

  const submitNames = (e: React.FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (yourName.trim().length < 2) found.yourName = "Informe o seu nome.";
    if (partnerName.trim().length < 2) found.partnerName = "Informe o nome de quem vai casar com você.";
    setErrors(found);
    if (found.yourName) return document.getElementById("onb-yourName")?.focus();
    if (found.partnerName) return document.getElementById("onb-partnerName")?.focus();
    next();
  };

  const submitDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noDateYet && !weddingDate) {
      setErrors({ date: "Escolham a data ou marquem que ainda não têm." });
      document.getElementById("onb-date")?.focus();
      return;
    }
    setErrors({});
    next();
  };

  const finish = () => {
    setFormError("");
    startTransition(async () => {
      const res = await completeOnboarding({
        yourName,
        partnerName,
        weddingDate: noDateYet || !weddingDate ? null : weddingDate,
        city,
        guestEstimate,
        themeColor,
      });
      if (!res.success) {
        if (res.redirectTo) {
          window.location.href = res.redirectTo;
          return;
        }
        setFormError(res.error);
        return;
      }
      setResult({ slug: res.slug, coupleNames: res.coupleNames });
      go("pronto");
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
      footnote="Tudo isso pode ser alterado depois, no editor do site."
    >
      {step !== "pronto" ? <Progress current={index + 1} total={STEPS.length} /> : null}

      {step === "nomes" ? (
        <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
          <ShellHeading
            ref={headingRef}
            title={firstName ? `Boas-vindas, ${firstName}` : "Boas-vindas"}
            text="Vamos preparar o casamento de vocês. Leva um minuto."
          />
          <form onSubmit={submitNames} noValidate className="flex flex-col gap-5">
            <Field id="onb-yourName" label="Seu nome" icon={User} error={errors.yourName}>
              {(c) => (
                <input {...c} id="onb-yourName" autoComplete="given-name" maxLength={60} value={yourName} onChange={(e) => setYourName(e.target.value)} />
              )}
            </Field>
            <Field id="onb-partnerName" label="Nome de quem vai casar com você" icon={Heart} error={errors.partnerName}>
              {(c) => (
                <input {...c} id="onb-partnerName" autoComplete="off" maxLength={60} value={partnerName} onChange={(e) => setPartnerName(e.target.value)} />
              )}
            </Field>
            <p className="rounded-[12px] border border-linha bg-papel px-4 py-3 text-[15px] text-tinta-suave">
              No site vai aparecer <strong className="font-display text-lg font-normal text-tinta">{coupleNames}</strong>
            </p>
            <button type="submit" className={cn(btn.primary, btn.block, "min-h-12")}>
              Continuar
              <ArrowRight aria-hidden="true" className={btnArrow} />
            </button>
          </form>
        </section>
      ) : null}

      {step === "data" ? (
        <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
          <ShellHeading ref={headingRef} title="Quando é o grande dia?" text="Usamos a data na contagem regressiva e no site." />
          <form onSubmit={submitDate} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Field id="onb-date" label="Data do casamento" icon={CalendarHeart} error={errors.date}>
                {(c) => (
                  <input
                    {...c}
                    id="onb-date"
                    type="date"
                    value={weddingDate}
                    disabled={noDateYet}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    className={cn(c.className, "disabled:cursor-not-allowed disabled:opacity-50")}
                  />
                )}
              </Field>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-tinta">
                <input
                  type="checkbox"
                  checked={noDateYet}
                  onChange={(e) => {
                    setNoDateYet(e.target.checked);
                    setErrors({});
                  }}
                  className="size-5 cursor-pointer rounded-[6px] accent-[var(--color-ameixa)]"
                />
                Ainda não temos a data
              </label>
            </div>
            <StepButtons onBack={back} />
          </form>
        </section>
      ) : null}

      {step === "cidade" ? (
        <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
          <ShellHeading ref={headingRef} title="Onde vai ser?" text="A cidade ajuda a encontrar fornecedores perto de vocês." />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
            noValidate
            className="flex flex-col gap-5"
          >
            <Field id="onb-city" label="Cidade" icon={MapPin} optional>
              {(c) => (
                <input
                  {...c}
                  id="onb-city"
                  autoComplete="address-level2"
                  placeholder="Ex.: Campinas, SP"
                  maxLength={80}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              )}
            </Field>
            <StepButtons onBack={back} label={city.trim() ? "Continuar" : "Pular por enquanto"} />
          </form>
        </section>
      ) : null}

      {step === "convidados" ? (
        <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
          <ShellHeading ref={headingRef} title="Quantos convidados?" text="Uma estimativa já basta. Dá para mudar depois." />
          <div role="radiogroup" aria-label="Número de convidados" className="grid grid-cols-2 gap-3">
            {GUEST_RANGES.map((range) => {
              const selected = guestEstimate === range;
              return (
                <button
                  key={range}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setGuestEstimate(range)}
                  className={cn(
                    "flex min-h-16 cursor-pointer items-center gap-3 rounded-[16px] bg-papel px-4 text-left transition-[border-color,box-shadow] duration-300 ease-[var(--ease-aceito)] hover:shadow-[var(--shadow-aceito-1)]",
                    selected ? "border-2 border-ameixa px-[15px]" : "border border-linha hover:border-linha-forte",
                  )}
                >
                  <Users aria-hidden="true" className={cn("size-5 shrink-0", selected ? "text-ameixa" : "text-tinta-suave")} strokeWidth={1.75} />
                  <span className="font-semibold text-tinta">{range}</span>
                </button>
              );
            })}
          </div>
          <StepButtons onBack={back} onNext={next} label={guestEstimate ? "Continuar" : "Pular por enquanto"} />
        </section>
      ) : null}

      {step === "cor" ? (
        <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
          <ShellHeading ref={headingRef} title="A cor do site" text="Escolham a cor principal do site do casamento." />
          <div className="overflow-hidden rounded-[16px] border border-linha bg-papel" aria-hidden="true">
            <div className="h-2 transition-colors duration-500" style={{ backgroundColor: themeColor }} />
            <div className="flex flex-col items-center gap-1 px-4 py-6 text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">Vamos nos casar</span>
              <span className="font-display text-[28px] leading-9 transition-colors duration-500" style={{ color: themeColor }}>
                {coupleNames}
              </span>
              <span className="mt-2 inline-flex min-h-9 items-center rounded-[10px] px-4 text-sm font-semibold text-on-ameixa transition-colors duration-500" style={{ backgroundColor: themeColor }}>
                Confirmar presença
              </span>
            </div>
          </div>
          <div role="radiogroup" aria-label="Cor do site" className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3">
            {THEME_PRESETS.map((preset) => {
              const selected = themeColor === preset.hex;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setThemeColor(preset.hex)}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center gap-2.5 rounded-[12px] bg-papel px-3 text-left text-sm font-semibold text-tinta transition-[border-color,box-shadow] duration-300",
                    selected ? "border-2 border-ameixa px-[11px]" : "border border-linha hover:border-linha-forte",
                  )}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full" style={{ backgroundColor: preset.hex }}>
                    {selected ? <Check aria-hidden="true" className="size-3.5 text-on-ameixa" strokeWidth={3} /> : null}
                  </span>
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>

          {formError ? <FormAlert id="onb-erro">{formError}</FormAlert> : null}

          <div className="flex items-center gap-3">
            <BackButton onClick={back} />
            <button type="button" onClick={finish} disabled={isPending} className={cn(btn.primary, "min-h-12 flex-1")}>
              {isPending ? (
                <>
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  Preparando tudo…
                </>
              ) : (
                <>
                  <Palette aria-hidden="true" className="size-4" />
                  Concluir
                </>
              )}
            </button>
          </div>
        </section>
      ) : null}

      {step === "pronto" && result ? (
        <section aria-labelledby="titulo" className="step-in flex flex-col gap-6">
          <span className="grid size-14 place-items-center rounded-full bg-sucesso-suave text-sucesso">
            <CheckCircle2 aria-hidden="true" className="size-7" strokeWidth={1.75} />
          </span>
          <ShellHeading ref={headingRef} title="Tudo pronto" text={`O casamento de ${result.coupleNames} já tem endereço no Aceito.`} />

          <div className="flex flex-col gap-2 rounded-[16px] border border-linha bg-papel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">Endereço do site</p>
            <div className="flex items-center gap-2">
              <Globe aria-hidden="true" className="size-[18px] shrink-0 text-ameixa" strokeWidth={1.75} />
              <a href={sitePath} target="_blank" rel="noopener" className="min-w-0 flex-1 break-all font-semibold text-tinta underline decoration-linha underline-offset-4 hover:decoration-ameixa">
                {origin ? `${origin.replace(/^https?:\/\//, "")}${sitePath}` : sitePath}
              </a>
              <button type="button" onClick={copyAddress} className={cn(btn.quiet, btn.sm, "min-h-11 shrink-0")}>
                {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="text-sm text-tinta-suave" aria-live="polite">
              {copied ? "Endereço copiado." : "Compartilhem quando o site estiver do jeito de vocês."}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-tinta">Primeiros passos</p>
            <FirstStep href="/site-builder" icon={Palette} title="Personalizar o site" text="Fotos, história, local e horários." />
            <FirstStep href="/convidados" icon={Users} title="Adicionar convidados" text="Cadastre a lista ou importe de uma planilha, e mande os convites." />
            <FirstStep href="/dashboard" icon={LayoutDashboard} title="Ir para o painel" text="Tudo do casamento num lugar só." />
          </div>
        </section>
      ) : null}
    </AuthShell>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-6 flex items-center gap-3" aria-label={`Passo ${current} de ${total}`}>
      <div className="flex flex-1 gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => i + 1).map((i) => (
          <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-areia">
            <span
              className={cn(
                "block h-full origin-left rounded-full bg-ameixa transition-transform duration-500 ease-[var(--ease-aceito)]",
                i <= current ? "scale-x-100" : "scale-x-0",
              )}
            />
          </span>
        ))}
      </div>
      <span className="text-sm font-semibold tabular-nums text-tinta-suave" aria-hidden="true">
        {current} de {total}
      </span>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Voltar" className={cn(btn.secondary, "min-h-12 w-12 shrink-0 px-0")}>
      <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.75} />
    </button>
  );
}

function StepButtons({ onBack, onNext, label = "Continuar" }: { onBack: () => void; onNext?: () => void; label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <BackButton onClick={onBack} />
      <button type={onNext ? "button" : "submit"} onClick={onNext} className={cn(btn.primary, "min-h-12 flex-1")}>
        {label}
        <ArrowRight aria-hidden="true" className={btnArrow} />
      </button>
    </div>
  );
}

function FirstStep({ href, icon: Icon, title, text }: { href: string; icon: typeof Users; title: string; text: string }) {
  // Navegação completa: o painel precisa ler o cookie de sessão atualizado no onboarding.
  return (
    <a
      href={href}
      className="group flex items-center gap-4 rounded-[16px] border border-linha bg-papel p-4 transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-aceito)] hover:-translate-y-0.5 hover:border-ameixa hover:shadow-[var(--shadow-aceito-2)]"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-ameixa-suave text-ameixa">
        <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-tinta">{title}</span>
        <span className="block text-sm text-tinta-suave">{text}</span>
      </span>
      <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-tinta-suave transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ameixa" />
    </a>
  );
}
