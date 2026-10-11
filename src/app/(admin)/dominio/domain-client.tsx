"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Check, CheckCircle2, Clock, Copy, ExternalLink, Globe, Info, Loader2, XCircle } from "lucide-react";
import { cancelDomainOrderAction, checkDomainAvailabilityAction, requestDomainAction } from "@/actions/domain-actions";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Chip, card, cardTitle, type ChipTone } from "@/components/casal/ui";
import { btn } from "@/components/landing/styles";
import { cn } from "@/lib/utils";
import { AVAILABILITY_TEXT, type DomainAvailability } from "@/lib/domain-availability";
import { DOMAIN_SUFFIX, normalizeDomainName, suggestDomainNames } from "@/lib/domain-name";
import { STATUS_LABEL, TIMELINE_STEPS, timelineStates, type DomainRequestField, type TimelineState } from "@/lib/domain-order";
import { formatDocument } from "@/lib/document-br";
import { DOMAIN_TERMS_CHECKBOX, DOMAIN_TERMS_TEXT } from "@/lib/domain-terms";
import type { DomainOrderView } from "@/lib/domain-orders";

interface Props {
  coupleNames: string;
  weddingDate: string | null;
  order: DomainOrderView | null;
  lastClosed: DomainOrderView | null;
  defaults: { name: string; email: string };
}

const dateTime = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
// Vencimento e registro são datas de calendário, gravadas à meia-noite UTC
const calendarDate = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const fmt = (iso: string | null, calendar = false) => (iso ? (calendar ? calendarDate : dateTime).format(new Date(iso)) : null);

export function DomainClient({ coupleNames, weddingDate, order, lastClosed, defaults }: Props) {
  return (
    <div className="flex max-w-[880px] flex-col gap-6">
      <PageHeader
        eyebrow="Site e presentes"
        title="Domínio próprio"
        description={
          order
            ? "Acompanhem o endereço do site de vocês, do pedido até o dia em que ele entra no ar."
            : "Um endereço só de vocês para os convites, como anaerafael.com.br. O domínio é registrado no nome do titular."
        }
      />
      {order ? (
        <OrderProgress order={order} />
      ) : (
        <>
          {lastClosed?.status === "REJECTED" ? <RejectedNotice order={lastClosed} /> : null}
          <RequestForm coupleNames={coupleNames} weddingDate={weddingDate} defaults={defaults} />
        </>
      )}
    </div>
  );
}

// ==========================================
// PEDIDO RECUSADO
// ==========================================

function RejectedNotice({ order }: { order: DomainOrderView }) {
  return (
    <section aria-labelledby="dominio-recusado" className="flex items-start gap-3 rounded-2xl border border-aviso/30 bg-aviso-suave p-4 text-[15px] text-tinta">
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-aviso" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <h2 id="dominio-recusado" className="font-semibold">
          O pedido de {order.domain} não pôde ser feito
        </h2>
        {order.rejectionReason ? <p>{order.rejectionReason}</p> : null}
        <p>Vocês podem fazer um novo pedido logo abaixo.</p>
      </div>
    </section>
  );
}

// ==========================================
// FORMULÁRIO DO PEDIDO
// ==========================================

type Check =
  | { state: "idle" }
  | { state: "invalid"; message: string }
  | { state: "checking" }
  | { state: "error"; message: string }
  | { state: DomainAvailability; domain: string };

const CHECK_TONE: Record<"sucesso" | "perigo" | "aviso" | "neutro", ChipTone> = { sucesso: "sucesso", perigo: "perigo", aviso: "aviso", neutro: "neutro" };

function CheckResult({ check }: { check: Check }) {
  if (check.state === "idle") return null;
  if (check.state === "checking") {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-tinta-suave">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Conferindo se está livre…
      </p>
    );
  }
  if (check.state === "invalid" || check.state === "error") {
    return (
      <p role="status" className="flex items-start gap-2 text-sm font-semibold text-perigo">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {check.message}
      </p>
    );
  }
  const spec = AVAILABILITY_TEXT[check.state];
  const Icon = check.state === "available" ? CheckCircle2 : check.state === "taken" ? XCircle : check.state === "releasing" ? Clock : Info;
  const label = check.state === "available" ? "Livre" : check.state === "taken" ? "Já tem dono" : check.state === "releasing" ? "Em liberação" : "Sem resposta agora";
  return (
    <div role="status" className="flex flex-col gap-2">
      <Chip tone={CHECK_TONE[spec.tone]} icon={Icon}>
        {label}
      </Chip>
      <p className="text-sm leading-5 text-tinta">{spec.text(check.domain)}</p>
    </div>
  );
}

function RequestForm({ coupleNames, weddingDate, defaults }: Pick<Props, "coupleNames" | "weddingDate" | "defaults">) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [holderName, setHolderName] = useState(defaults.name);
  const [holderDocument, setHolderDocument] = useState("");
  const [holderEmail, setHolderEmail] = useState(defaults.email);
  const [holderPhone, setHolderPhone] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [check, setCheck] = useState<Check>({ state: "idle" });
  const [errors, setErrors] = useState<Partial<Record<DomainRequestField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequence = useRef(0);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const suggestions = useMemo(
    () => suggestDomainNames({ coupleNames, weddingDate: weddingDate ? new Date(weddingDate) : null }, { max: 5 }),
    [coupleNames, weddingDate],
  );

  /** Confere o nome depois de uma pausa na digitação (ou na hora, ao escolher uma sugestão). */
  function scheduleCheck(value: string, immediately = false) {
    if (timer.current) clearTimeout(timer.current);
    const mine = ++sequence.current;
    const parsed = normalizeDomainName(value);
    if (!parsed.ok) {
      setCheck(value.trim() ? { state: "invalid", message: parsed.error } : { state: "idle" });
      return;
    }
    setCheck({ state: "checking" });
    timer.current = setTimeout(
      async () => {
        const result = await checkDomainAvailabilityAction({ domain: parsed.domain });
        if (mine !== sequence.current) return;
        setCheck(result.success ? { state: result.availability, domain: result.domain } : { state: "error", message: result.error });
      },
      immediately ? 0 : 600,
    );
  }

  function changeName(value: string) {
    setName(value);
    setErrors((e) => ({ ...e, domain: undefined }));
    scheduleCheck(value);
  }

  function pick(domain: string) {
    const label = domain.slice(0, -DOMAIN_SUFFIX.length);
    setName(label);
    setErrors((e) => ({ ...e, domain: undefined }));
    scheduleCheck(label, true);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const result = await requestDomainAction({ domain: name, holderName, holderDocument, holderEmail, holderPhone, accepted });
      if (result.success) {
        toast.success("Pedido enviado. Avisamos quando o domínio for registrado.");
        router.refresh();
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error ?? (result.fieldErrors ? "Confiram os campos marcados." : null));
    });
  }

  const nameParsed = normalizeDomainName(name);
  const blocked = check.state === "taken" || check.state === "releasing";

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <section aria-labelledby="dominio-endereco" className={cn(card, "flex flex-col gap-4 p-5 sm:p-6")}>
        <div className="flex flex-col gap-1">
          <h2 id="dominio-endereco" className={cardTitle}>
            Qual endereço vocês querem?
          </h2>
          <p className="text-[15px] text-tinta-suave">Hoje registramos endereços terminados em {DOMAIN_SUFFIX}.</p>
        </div>

        <Field
          htmlFor="dominio-nome"
          label="Nome do endereço"
          hint="Só letras, números e hífen. Pode digitar do seu jeito, nós arrumamos."
          error={errors.domain}
        >
          <div className="flex items-stretch">
            <Input
              id="dominio-nome"
              value={name}
              onChange={(e) => changeName(e.target.value)}
              placeholder="anaerafael"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="url"
              aria-invalid={!!errors.domain}
              aria-describedby={["dominio-nome-dica", errors.domain ? "dominio-nome-erro" : ""].filter(Boolean).join(" ")}
              className="min-w-0 rounded-r-none border-r-0"
            />
            <span className="flex items-center rounded-r-xl border border-l-0 border-linha-forte bg-areia px-3 text-base font-semibold text-tinta-suave">
              {DOMAIN_SUFFIX}
            </span>
          </div>
        </Field>

        {nameParsed.ok && name.trim() && nameParsed.label !== name.trim().toLowerCase() ? (
          <p className="text-sm text-tinta-suave">
            Vai ficar assim: <strong className="font-semibold text-tinta">{nameParsed.domain}</strong>
          </p>
        ) : null}

        <CheckResult check={check} />

        {suggestions.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p id="dominio-sugestoes" className="text-sm font-semibold text-tinta">
              Ideias para vocês
            </p>
            <ul aria-labelledby="dominio-sugestoes" className="flex flex-wrap gap-2">
              {suggestions.map((domain) => (
                <li key={domain}>
                  <button
                    type="button"
                    onClick={() => pick(domain)}
                    className="inline-flex min-h-11 items-center rounded-xl border border-linha-forte bg-papel px-4 text-[15px] font-semibold text-tinta transition-colors hover:border-ameixa hover:bg-ameixa-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa"
                  >
                    {domain}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="dominio-titular" className={cn(card, "flex flex-col gap-4 p-5 sm:p-6")}>
        <div className="flex flex-col gap-1">
          <h2 id="dominio-titular" className={cardTitle}>
            Quem vai ser o dono do domínio?
          </h2>
          <p className="text-[15px] text-tinta-suave">
            O domínio fica registrado no nome do titular (uma pessoa com CPF ou uma empresa com CNPJ). O Registro.br pede esses dados.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="dominio-titular-nome" label="Nome completo ou razão social" error={errors.holderName} className="sm:col-span-2">
            <Input
              id="dominio-titular-nome"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              autoComplete="name"
              aria-invalid={!!errors.holderName}
              aria-describedby={errors.holderName ? "dominio-titular-nome-erro" : undefined}
            />
          </Field>
          <Field
            htmlFor="dominio-titular-doc"
            label="CPF ou CNPJ"
            hint="Guardamos só até concluir o registro. Depois escondemos os números."
            error={errors.holderDocument}
          >
            <Input
              id="dominio-titular-doc"
              value={holderDocument}
              onChange={(e) => setHolderDocument(e.target.value)}
              onBlur={() => setHolderDocument((v) => formatDocument(v))}
              autoComplete="off"
              inputMode="text"
              aria-invalid={!!errors.holderDocument}
              aria-describedby={["dominio-titular-doc-dica", errors.holderDocument ? "dominio-titular-doc-erro" : ""].filter(Boolean).join(" ")}
            />
          </Field>
          <Field htmlFor="dominio-titular-tel" label="Telefone com DDD" error={errors.holderPhone}>
            <Input
              id="dominio-titular-tel"
              type="tel"
              value={holderPhone}
              onChange={(e) => setHolderPhone(e.target.value)}
              autoComplete="tel"
              placeholder="(11) 91234-5678"
              aria-invalid={!!errors.holderPhone}
              aria-describedby={errors.holderPhone ? "dominio-titular-tel-erro" : undefined}
            />
          </Field>
          <Field htmlFor="dominio-titular-email" label="E-mail do titular" error={errors.holderEmail} className="sm:col-span-2">
            <Input
              id="dominio-titular-email"
              type="email"
              value={holderEmail}
              onChange={(e) => setHolderEmail(e.target.value)}
              autoComplete="email"
              aria-invalid={!!errors.holderEmail}
              aria-describedby={errors.holderEmail ? "dominio-titular-email-erro" : undefined}
            />
          </Field>
        </div>
      </section>

      <section aria-labelledby="dominio-condicoes" className={cn(card, "flex flex-col gap-4 p-5 sm:p-6")}>
        <h2 id="dominio-condicoes" className={cardTitle}>
          Condições
        </h2>
        <p className="rounded-xl bg-areia p-4 text-[15px] leading-6 text-tinta">{DOMAIN_TERMS_TEXT}</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="dominio-aceite"
              checked={accepted}
              onCheckedChange={(v) => {
                setAccepted(v === true);
                setErrors((e) => ({ ...e, accepted: undefined }));
              }}
              aria-invalid={!!errors.accepted}
              aria-describedby={errors.accepted ? "dominio-aceite-erro" : undefined}
              className="mt-0.5"
            />
            <label htmlFor="dominio-aceite" className="min-h-6 cursor-pointer text-[15px] leading-6 text-tinta">
              {DOMAIN_TERMS_CHECKBOX}
            </label>
          </div>
          {errors.accepted ? (
            <p id="dominio-aceite-erro" role="alert" className="flex items-center gap-1 text-sm font-semibold text-perigo">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" /> {errors.accepted}
            </p>
          ) : null}
        </div>

        {formError ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {formError}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-tinta-suave">
            {blocked ? "Escolham outro nome para continuar." : "Depois do pedido, acompanhem cada etapa aqui."}
          </p>
          <Button type="submit" size="lg" disabled={pending || blocked} aria-busy={pending} className="w-full sm:w-auto">
            {pending ? "Enviando…" : "Pedir meu domínio"}
          </Button>
        </div>
      </section>
    </form>
  );
}

// ==========================================
// ANDAMENTO DO PEDIDO
// ==========================================

const STATE_LABEL: Record<TimelineState, string> = { done: "Concluído", current: "Em andamento", next: "A seguir", todo: "Depois" };

function StepDot({ state }: { state: TimelineState }) {
  const base = "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2";
  if (state === "done") {
    return (
      <span className={cn(base, "border-ameixa bg-ameixa text-on-ameixa")}>
        <Check className="size-4" aria-hidden="true" />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className={cn(base, "border-ameixa bg-ameixa-suave text-ameixa")}>
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      </span>
    );
  }
  return <span className={cn(base, "border-linha-forte bg-papel", state === "next" && "border-ameixa")} aria-hidden="true" />;
}

function OrderProgress({ order }: { order: DomainOrderView }) {
  const states = timelineStates(order.status) ?? [];
  const dates: Record<string, string | null> = {
    REQUESTED: fmt(order.requestedAt),
    REGISTERING: null,
    REGISTERED: fmt(order.registeredAt, true),
    CONNECTED: fmt(order.connectedAt),
  };

  return (
    <div className="flex flex-col gap-6">
      {order.status === "CONNECTED" ? <ConnectedCard domain={order.domain} /> : null}

      <section aria-labelledby="dominio-andamento" className={cn(card, "flex flex-col gap-5 p-5 sm:p-6")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id="dominio-andamento" className="text-sm text-tinta-suave">
              Seu pedido
            </h2>
            <p className="break-all font-display text-[28px] leading-8 text-tinta sm:text-[32px] sm:leading-9">{order.domain}</p>
          </div>
          <Chip tone={order.status === "CONNECTED" ? "sucesso" : order.status === "REGISTERED" ? "salvia" : "aviso"} icon={order.status === "CONNECTED" ? CheckCircle2 : Clock}>
            {STATUS_LABEL[order.status]}
          </Chip>
        </div>

        <ol className="flex flex-col">
          {TIMELINE_STEPS.map((step, index) => {
            const state = states[index] ?? "todo";
            const date = dates[step.status];
            const last = index === TIMELINE_STEPS.length - 1;
            return (
              <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0" aria-current={state === "current" ? "step" : undefined}>
                {!last ? (
                  <span aria-hidden="true" className={cn("absolute top-8 bottom-0 left-4 w-0.5 -translate-x-1/2", state === "done" && states[index + 1] === "done" ? "bg-ameixa" : "bg-linha-forte")} />
                ) : null}
                <StepDot state={state} />
                <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
                  <p className={cn("text-base font-semibold leading-6", state === "done" || state === "current" ? "text-tinta" : "text-tinta-suave")}>
                    {step.title}
                    <span className="ml-2 text-sm font-normal text-tinta-suave">{STATE_LABEL[state]}</span>
                  </p>
                  <p className="text-[15px] leading-6 text-tinta-suave">{state === "done" ? step.doneText : step.text}</p>
                  {date && state === "done" ? <p className="text-sm text-tinta-suave">{step.status === "REQUESTED" ? `Pedido em ${date}` : step.status === "REGISTERED" ? `Registrado em ${date}` : `No ar desde ${date}`}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>

        {order.expiresAt ? (
          <p className="rounded-xl bg-areia p-4 text-[15px] leading-6 text-tinta">
            O primeiro ano está incluído e o domínio vence em <strong className="font-semibold">{fmt(order.expiresAt, true)}</strong>.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="dominio-titular-dados" className={cn(card, "flex flex-col gap-4 p-5 sm:p-6")}>
        <h2 id="dominio-titular-dados" className={cardTitle}>
          Titular do domínio
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Fact label="Nome">{order.holderName}</Fact>
          <Fact label="CPF ou CNPJ">{order.holderDocumentMasked}</Fact>
          <Fact label="E-mail">{order.holderEmail}</Fact>
          <Fact label="Telefone">{order.holderPhone}</Fact>
        </dl>
        <p className="text-sm text-tinta-suave">{DOMAIN_TERMS_TEXT}</p>
        {order.status === "REQUESTED" ? <CancelButton /> : null}
      </section>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-sm font-semibold leading-5 text-tinta-suave">{label}</dt>
      <dd className="min-w-0 break-words text-base leading-6 text-tinta">{children}</dd>
    </div>
  );
}

function CancelButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await cancelDomainOrderAction();
      if (result.success) {
        toast.success("Pedido cancelado.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
        setOpen(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 border-t border-linha pt-4">
      <p className="text-sm text-tinta-suave">Mudaram de ideia? Dá para cancelar enquanto o registro não começou.</p>
      <div>
        <Button type="button" variant="danger" onClick={() => setOpen(true)}>
          Cancelar o pedido
        </Button>
      </div>
      <ConfirmModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        title="Cancelar o pedido de domínio?"
        description="Apagamos os dados do titular e liberamos o nome. Vocês podem fazer um novo pedido quando quiserem."
        confirmText="Cancelar o pedido"
        cancelText="Voltar"
        isLoading={pending}
      />
    </div>
  );
}

function ConnectedCard({ domain }: { domain: string }) {
  const url = `https://${domain}`;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar. Selecione o endereço e copie à mão.");
    }
  }

  return (
    <section aria-labelledby="dominio-no-ar" className="flex flex-col gap-4 rounded-2xl bg-ameixa p-5 text-on-ameixa shadow-[var(--shadow-aceito-2)] sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-on-ameixa/15">
          <Globe className="size-5" aria-hidden="true" />
        </span>
        <h2 id="dominio-no-ar" className="text-xl font-semibold leading-7">
          O site de vocês está no ar
        </h2>
      </div>
      <p className="break-all font-display text-[28px] leading-8 sm:text-[34px] sm:leading-10">{domain}</p>
      <p className="text-[15px] leading-6">Os links enviados aos convidados já usam este endereço.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <a href={url} target="_blank" rel="noopener noreferrer" className={cn(btn.onAmeixa, "min-h-11")}>
          <ExternalLink className="size-4" aria-hidden="true" />
          Abrir o site
          <span className="sr-only"> (abre em outra aba)</span>
        </a>
        <button type="button" onClick={copy} className={cn(btn.onAmeixa, "min-h-11 bg-transparent text-on-ameixa ring-1 ring-on-ameixa/50 hover:bg-on-ameixa/10")}>
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? "Link copiado" : "Copiar o link"}
        </button>
      </div>
    </section>
  );
}
