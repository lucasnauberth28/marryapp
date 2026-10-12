"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarHeart,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Heart,
 
  Lock,
  Mail,
  MapPin,
  Phone,
  Store,
  User,
} from "lucide-react";
import { registerPlanAccount, type PlanRegistrationData } from "@/actions/subscription-actions";
import { SubscriptionPix } from "@/components/checkout/subscription-pix";
import { VENDOR_CATEGORIES } from "@/app/(fornecedor)/_lib/vendor-panel";
import { btn, btnArrow } from "@/components/landing/styles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Field, FormAlert } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/select";
import { maskDocument, maskPhone } from "@/lib/masks";
import { formatPrice, plansFor, type AccountType, type PlanOption, type SignupStep } from "./auth-config";
import type { Catalog } from "@/lib/catalog";

interface SignupFlowProps {
  step: SignupStep;
  type: AccountType | null;
  onStepChange: (step: SignupStep) => void;
  onTypeChange: (type: AccountType) => void;
  /** Plano vindo da URL (?plano=classic) ou do plano adaptado. */
  initialPlanId?: string;
  customModules?: string[];
  /** Preços vigentes (catálogo do servidor). */
  catalog?: Catalog;
  /** Conta já existente: leva para a aba Entrar com o e-mail preenchido. */
  onGoToLogin: (email: string) => void;
}

type Errors = Partial<Record<"name" | "email" | "phone" | "password" | "companyName" | "city" | "document", string>>;

const STEP_LABEL: Record<SignupStep, string> = {
  tipo: "Tipo de conta",
  plano: "Plano",
  dados: "Dados da conta",
  pagamento: "Pagamento",
  pronto: "Pronto",
};

/** Mensagem do servidor -> campo a que ela se refere (para não ficar só num aviso solto). */
function fieldOfServerError(message: string): keyof Errors | null {
  if (/e-?mail/i.test(message) && !/já existe/i.test(message)) return "email";
  if (/senha/i.test(message)) return "password";
  if (/telefone/i.test(message)) return "phone";
  if (/nome do negócio|nome da empresa/i.test(message)) return "companyName";
  if (/documento/i.test(message)) return "document";
  if (/nome/i.test(message)) return "name";
  return null;
}

export function SignupFlow({ step, type, onStepChange, onTypeChange, initialPlanId, customModules, catalog, onGoToLogin }: SignupFlowProps) {
  const plans = useMemo(() => (type ? plansFor(type, customModules, catalog) : []), [type, customModules, catalog]);
  const [planId, setPlanId] = useState<string | null>(initialPlanId ?? null);
  // Sem plano na URL, a escolha começa pelo primeiro da lista (Básico para casais, Start para fornecedores).
  const plan: PlanOption | undefined = plans.find((p) => p.id === planId) ?? plans[0];
  // Etapas reais do caminho: o tipo de conta só conta se a pessoa passou por ele, e o pagamento só existe em plano pago.
  const [startedAtType] = useState(step === "tipo");
  const flowSteps: SignupStep[] = [...(startedAtType ? (["tipo"] as const) : []), "plano", "dados", ...(plan && plan.price > 0 ? (["pagamento"] as const) : [])];

  // Dados da conta
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [weddingDate, setWeddingDate] = useState("");
  const [noDateYet, setNoDateYet] = useState(false);
  // Fornecedor
  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState<string>(VENDOR_CATEGORIES[0]);
  const [city, setCity] = useState("");
  const [documentType, setDocumentType] = useState<"CNPJ" | "CPF">("CNPJ");
  const [documentNumber, setDocumentNumber] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<{ message: string; existingAccount?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const [paid, setPaid] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const isVendor = type === "fornecedor";

  // A cada troca de etapa, o foco vai para o título novo (teclado e leitor de tela acompanham).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const payload = (): PlanRegistrationData => ({
    planType: isVendor ? "VENDOR" : "COUPLE",
    planId: (plan?.id ?? "basic") as PlanRegistrationData["planId"],
    modules: plan?.id === "custom" ? customModules : undefined,
    planName: plan?.name ?? "",
    amount: plan?.price ?? 0,
    name,
    email: email.trim().toLowerCase(),
    phone,
    password,
    weddingDate: !isVendor && weddingDate && !noDateYet ? new Date(`${weddingDate}T12:00:00`) : null,
    companyName: isVendor ? companyName : undefined,
    vendorCategory: isVendor ? category : undefined,
    vendorRegion: isVendor ? city : undefined,
    documentType: isVendor ? documentType : undefined,
    documentNumber: isVendor ? documentNumber : undefined,
  });

  const validate = (): Errors => {
    const e: Errors = {};
    if (name.trim().length < 3) e.name = "Informe seu nome com pelo menos 3 letras.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Confira o e-mail. Ele deve ter um formato como nome@exemplo.com.";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) e.phone = "Informe o número com DDD, com 10 ou 11 dígitos.";
    if (password.length < 8) e.password = "Use pelo menos 8 caracteres.";
    if (isVendor) {
      if (companyName.trim().length < 2) e.companyName = "Informe o nome do negócio.";
      if (city.trim().length < 2) e.city = "Informe a cidade onde você atende.";
      const doc = documentNumber.replace(/\D/g, "");
      if (doc.length !== (documentType === "CPF" ? 11 : 14)) e.document = `Confira o ${documentType}.`;
    }
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Leva o foco ao primeiro campo com erro.
      const first = Object.keys(found)[0];
      document.getElementById(`cadastro-${first}`)?.focus();
      return;
    }

    startTransition(async () => {
      const res = await registerPlanAccount(payload());
      if (!res.success) {
        const message = res.error || "Não foi possível criar a conta agora. Tentem novamente.";
        const field = fieldOfServerError(message);
        if (field) {
          // O que já foi preenchido fica como está; o erro aparece no campo a que se refere.
          setErrors({ [field]: message });
          document.getElementById(`cadastro-${field}`)?.focus();
        } else {
          setFormError({ message, existingAccount: /já existe uma conta/i.test(message) });
        }
        return;
      }
      setRedirectTo(("redirectTo" in res && res.redirectTo) || null);
      if (plan && plan.price > 0) {
        onStepChange("pagamento");
      } else {
        onStepChange("pronto");
      }
    });
  };

  const handlePaid = useCallback(() => {
    setPaid(true);
    onStepChange("pronto");
  }, [onStepChange]);

  const firstName = name.trim().split(/\s+/)[0] || "";

  return (
    <div className="flex flex-col">
      {step !== "pronto" ? <Progress step={step} steps={flowSteps} /> : null}

      {/* 1. Quem está chegando */}
      {step === "tipo" ? (
        <section aria-labelledby="cadastro-titulo" className="step-in flex flex-col gap-6">
          <Heading ref={headingRef} title="Que conta vocês querem criar?" text="Escolham o tipo de conta. Convidados não precisam de conta: usam o link enviado pelo casal." />
          <div role="group" aria-label="Tipo de conta" className="flex flex-col gap-3">
            <TypeCard
              icon={Heart}
              title="Vamos casar"
              text="Site do casamento, lista de convidados e presentes em dinheiro."
              selected={type === "casal"}
              onClick={() => {
                onTypeChange("casal");
                if (planId && !plansFor("casal", customModules, catalog).some((p) => p.id === planId)) setPlanId(null);
                onStepChange("plano");
              }}
            />
            <TypeCard
              icon={Store}
              title="Sou fornecedor"
              text="Sua vitrine para casais da sua região, com pedidos de orçamento no painel."
              selected={type === "fornecedor"}
              onClick={() => {
                onTypeChange("fornecedor");
                if (planId && !plansFor("fornecedor", undefined, catalog).some((p) => p.id === planId)) setPlanId(null);
                onStepChange("plano");
              }}
            />
          </div>
        </section>
      ) : null}

      {/* 2. Plano */}
      {step === "plano" && type ? (
        <section aria-labelledby="cadastro-titulo" className="step-in flex flex-col gap-6">
          <Heading
            ref={headingRef}
            title={isVendor ? "Escolha seu plano" : "Escolham o plano para começar."}
            text={isVendor ? "O Start é gratuito. Você pode mudar de plano depois." : "O Básico permite começar sem mensalidade. Comparem os recursos e as taxas antes de continuar."}
          />
          <div role="radiogroup" aria-label="Planos" className="flex flex-col gap-3">
            {plans.map((p) => (
              <PlanCard key={p.id} plan={p} selected={plan?.id === p.id} onSelect={() => setPlanId(p.id)} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <BackButton onClick={() => onStepChange("tipo")} />
            <button type="button" onClick={() => onStepChange("dados")} className={cn(btn.primary, "min-h-12 flex-1")}>
              Continuar com o {plan?.name}
              <ArrowRight aria-hidden="true" className={btnArrow} />
            </button>
          </div>
          {!isVendor ? (
            <p className="text-center text-[15px] text-tinta-suave">
              Precisam só de algumas partes?{" "}
              <Link href="/monte-seu-plano" className="font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 hover:decoration-ameixa">
                Montem o plano de vocês
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}

      {/* 3. Dados */}
      {step === "dados" && type && plan ? (
        <section aria-labelledby="cadastro-titulo" className="step-in flex flex-col gap-6">
          <Heading
            ref={headingRef}
            title={isVendor ? "Dados do seu negócio" : "Criem a conta para organizar o casamento."}
            text={isVendor ? "Seu perfil passa pela curadoria antes de aparecer na vitrine." : "Uma pessoa pode começar o cadastro. Depois, vocês podem convidar o par para participar."}
          />

          <div className="flex items-center justify-between gap-3 rounded-[12px] border border-linha bg-papel px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">Plano escolhido</p>
              <p className="truncate font-semibold text-tinta">
                {plan.name} · {formatPrice(plan.price)}
                {plan.price > 0 ? <span className="font-normal text-tinta-suave"> {plan.period}</span> : null}
              </p>
            </div>
            <button type="button" onClick={() => onStepChange("plano")} className={cn(btn.quiet, btn.sm)}>
              Trocar
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <Field id="cadastro-name" label="Seu nome" icon={User} error={errors.name}>
              {(c) => (
                <input {...c} id="cadastro-name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              )}
            </Field>

            {isVendor ? (
              <>
                <Field id="cadastro-companyName" label="Nome do negócio" icon={Building2} error={errors.companyName}>
                  {(c) => (
                    <input
                      {...c}
                      id="cadastro-companyName"
                      name="organization"
                      autoComplete="organization"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  )}
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <NativeSelect id="cadastro-category" label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {VENDOR_CATEGORIES.map((cat) => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </NativeSelect>
                  <Field id="cadastro-city" label="Cidade onde atende" icon={MapPin} error={errors.city}>
                    {(c) => (
                      <input
                        {...c}
                        id="cadastro-city"
                        name="address-level2"
                        autoComplete="address-level2"
                        placeholder="Ex.: Campinas"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    )}
                  </Field>
                </div>
                <div className="flex flex-col gap-2">
                  <div role="radiogroup" aria-label="Tipo de documento" className="grid w-fit grid-cols-2 gap-1 rounded-[10px] bg-areia p-1">
                    {(["CNPJ", "CPF"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={documentType === t}
                        onClick={() => {
                          setDocumentType(t);
                          setDocumentNumber((v) => maskDocument(v, t));
                        }}
                        className={cn(
                          "min-h-9 rounded-[8px] px-4 text-sm font-semibold transition-colors",
                          documentType === t ? "bg-papel text-tinta shadow-[var(--shadow-aceito-1)]" : "text-tinta-suave hover:text-tinta",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <Field id="cadastro-document" label={documentType} icon={FileText} error={errors.document} hint="Usado só pela curadoria. Não aparece no seu perfil.">
                    {(c) => (
                      <input
                        {...c}
                        id="cadastro-document"
                        inputMode="numeric"
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(maskDocument(e.target.value, documentType))}
                        placeholder={documentType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                      />
                    )}
                  </Field>
                </div>
              </>
            ) : null}

            <Field id="cadastro-email" label="E-mail" icon={Mail} error={errors.email} hint="Usaremos este e-mail para o acesso à conta.">
              {(c) => (
                <input
                  {...c}
                  id="cadastro-email"
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

            <Field id="cadastro-phone" label="WhatsApp" icon={Phone} error={errors.phone} hint="Informe com DDD, por exemplo (11) 98765-4321.">
              {(c) => (
                <input
                  {...c}
                  id="cadastro-phone"
                  name="tel"
                  type="tel"
                  autoComplete="tel-national"
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                />
              )}
            </Field>

            <Field
              id="cadastro-password"
              label="Crie uma senha"
              icon={Lock}
              error={errors.password}
              hint="Pelo menos 8 caracteres."
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  className="grid size-11 cursor-pointer place-items-center rounded-[10px] text-tinta-suave transition-colors hover:bg-areia hover:text-tinta"
                >
                  {showPassword ? <EyeOff aria-hidden="true" className="size-[18px]" strokeWidth={1.75} /> : <Eye aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />}
                </button>
              }
            >
              {(c) => (
                <input
                  {...c}
                  id="cadastro-password"
                  name="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </Field>

            {!isVendor ? (
              <div className="flex flex-col gap-2">
                <Field id="cadastro-date" label="Data do casamento" icon={CalendarHeart} optional hint="Vocês podem adicionar ou alterar a data depois.">
                  {(c) => (
                    <input
                      {...c}
                      id="cadastro-date"
                      type="date"
                      value={weddingDate}
                      disabled={noDateYet}
                      onChange={(e) => setWeddingDate(e.target.value)}
                    />
                  )}
                </Field>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-tinta">
                  <input
                    type="checkbox"
                    checked={noDateYet}
                    onChange={(e) => setNoDateYet(e.target.checked)}
                    className="size-5 cursor-pointer rounded-[6px] accent-[var(--color-ameixa)]"
                  />
                  Ainda não temos a data
                </label>
              </div>
            ) : null}

            {formError ? (
              <FormAlert id="cadastro-erro">
                <p>{formError.message}</p>
                {formError.existingAccount ? (
                  <button
                    type="button"
                    onClick={() => onGoToLogin(email.trim().toLowerCase())}
                    className="mt-1 font-semibold text-ameixa underline underline-offset-4"
                  >
                    Entrar com este e-mail
                  </button>
                ) : null}
              </FormAlert>
            ) : null}

            <div className="mt-1 flex items-center gap-3">
              <BackButton onClick={() => onStepChange("plano")} />
              <Button type="submit" loading={isPending} className="h-12 flex-1 rounded-[12px] px-6">
                {plan.price > 0 ? "Criar conta e pagar" : "Criar conta"}
                <ArrowRight aria-hidden="true" className={btnArrow} />
              </Button>
            </div>
            <p className="text-center text-sm leading-5 text-tinta-suave">
              Ao criar a conta, você concorda com os{" "}
              <Link href="/termos" target="_blank" className="font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 hover:decoration-ameixa">
                termos de uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" target="_blank" className="font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 hover:decoration-ameixa">
                política de privacidade
              </Link>{" "}
              do Aceito.
            </p>
          </form>
        </section>
      ) : null}

      {/* 4. Pagamento */}
      {step === "pagamento" && plan ? (
        <section aria-labelledby="cadastro-titulo" className="step-in flex flex-col gap-6">
          <Heading
            ref={headingRef}
            title="Falta só o Pix"
            text="A conta já está criada. O plano é ativado assim que o pagamento for confirmado."
          />
          <SubscriptionPix planId={plan.id} modules={plan.id === "custom" ? customModules : undefined} planName={`Plano ${plan.name}`} onPaid={handlePaid} />
          <div className="flex flex-col gap-3">
            <button type="button" onClick={() => onStepChange("pronto")} className={cn(btn.quiet, "self-center")}>
              {isVendor ? "Pagar depois e continuar no plano Start" : "Pagar depois e continuar no plano Básico"}
            </button>
          </div>
        </section>
      ) : null}

      {/* 5. Pronto */}
      {step === "pronto" ? (
        <section aria-labelledby="cadastro-titulo" className="step-in flex flex-col gap-6">
          <span className="grid size-14 place-items-center rounded-full bg-sucesso-suave text-sucesso">
            <CheckCircle2 aria-hidden="true" className="size-7" strokeWidth={1.75} />
          </span>
          {isVendor ? (
            <>
              <Heading
                ref={headingRef}
                title={firstName ? `Boas-vindas, ${firstName}` : "Cadastro recebido"}
                text="Seu perfil já está na fila da curadoria. Enquanto isso, complete as informações no painel: perfis completos são aprovados mais rápido."
              />
              <a href={redirectTo ?? "/fornecedor"} className={cn(btn.primary, btn.block, "min-h-12")}>
                Ir para o meu painel
                <ArrowRight aria-hidden="true" className={btnArrow} />
              </a>
            </>
          ) : (
            <>
              <Heading
                ref={headingRef}
                title={firstName ? `Tudo certo, ${firstName}` : "Conta criada"}
                text={`A conta de vocês está criada${paid ? " e o pagamento foi confirmado" : ""}. Agora contem um pouco sobre o casamento: leva um minuto e o site já fica com a cara de vocês.`}
              />
              {/* Navegação completa: a próxima tela lê o cookie de sessão recém-criado. */}
              <a href={redirectTo ?? "/boas-vindas"} className={cn(btn.primary, btn.block, "min-h-12")}>
                Preparar o nosso casamento
                <ArrowRight aria-hidden="true" className={btnArrow} />
              </a>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}

function Heading({ ref, title, text }: { ref: React.Ref<HTMLHeadingElement>; title: string; text: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1
        ref={ref}
        id="cadastro-titulo"
        tabIndex={-1}
        className="font-display text-[34px] font-normal leading-10 tracking-[-0.015em] text-tinta outline-none lg:text-[44px] lg:leading-[50px]"
      >
        {title}
      </h1>
      <p className="text-base leading-6 text-tinta-suave">{text}</p>
    </div>
  );
}

function Progress({ step, steps }: { step: SignupStep; steps: SignupStep[] }) {
  const index = Math.max(0, steps.indexOf(step));
  const n = index + 1;
  const total = steps.length;
  return (
    <div className="mb-6 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-areia">
              <span
                className={cn(
                  "block h-full origin-left rounded-full bg-ameixa transition-transform duration-500 ease-[var(--ease-aceito)]",
                  i <= index ? "scale-x-100" : "scale-x-0",
                )}
              />
            </span>
          ))}
        </div>
        <span className="text-sm font-semibold tabular-nums text-tinta-suave">
          Etapa {n} de {total}
        </span>
      </div>
      <p className="sr-only">
        Etapa {n} de {total}: {STEP_LABEL[step]}
      </p>
      <p aria-hidden="true" className="text-sm text-tinta-suave">
        {steps.map((s, i) => (
          <span key={s} className={cn(i === index && "font-semibold text-tinta")}>
            {i > 0 ? " · " : ""}
            {STEP_LABEL[s]}
          </span>
        ))}
      </p>
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

function TypeCard({
  icon: Icon,
  title,
  text,
  selected,
  onClick,
}: {
  icon: typeof Heart;
  title: string;
  text: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-4 rounded-[16px] border bg-papel p-5 text-left transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-aceito)] hover:-translate-y-0.5 hover:border-ameixa hover:shadow-[var(--shadow-aceito-2)]",
        selected ? "border-2 border-ameixa" : "border-linha",
      )}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-[12px] bg-ameixa-suave text-ameixa">
        <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-2xl leading-8 text-tinta">{title}</span>
        <span className="mt-0.5 block text-[15px] leading-[22px] text-tinta-suave">{text}</span>
      </span>
      <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-tinta-suave transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ameixa" />
    </button>
  );
}

function PlanCard({ plan, selected, onSelect }: { plan: PlanOption; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative flex w-full cursor-pointer flex-col rounded-[16px] bg-papel p-5 text-left transition-[border-color,box-shadow] duration-300 ease-[var(--ease-aceito)] hover:shadow-[var(--shadow-aceito-1)]",
        selected ? "border-2 border-ameixa p-[19px] shadow-[var(--shadow-aceito-1)]" : "border border-linha hover:border-linha-forte",
      )}
    >
      <span className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
            selected ? "border-ameixa bg-ameixa" : "border-linha-forte bg-papel",
          )}
        >
          <Check className={cn("size-3 text-on-ameixa transition-opacity", selected ? "opacity-100" : "opacity-0")} strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold leading-7 text-tinta">{plan.name}</span>
            {plan.popular ? (
              <span className="inline-flex min-h-6 items-center rounded-[6px] bg-ameixa-suave px-2 text-xs font-semibold text-ameixa">
                Mais escolhido
              </span>
            ) : null}
          </span>
          <span className="block text-[15px] leading-[22px] text-tinta-suave">{plan.summary}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-display text-[28px] leading-8 text-tinta">{formatPrice(plan.price)}</span>
          <span className="block text-sm text-tinta-suave">{plan.period}</span>
        </span>
      </span>
      {/* Os itens do plano aparecem só no selecionado, para a lista caber na tela. */}
      <span
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-aceito)]",
          selected ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <span className="overflow-hidden">
          <span className="mt-4 flex flex-col gap-2 border-t border-linha pl-8 pt-4">
            {plan.features.map((f) => (
              <span key={f} className="flex items-start gap-2.5 text-[15px] leading-[22px] text-tinta">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sucesso" strokeWidth={2.25} />
                {f}
              </span>
            ))}
          </span>
        </span>
      </span>
    </button>
  );
}
