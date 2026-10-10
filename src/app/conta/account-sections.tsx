"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cancelPartnerInvite, changePassword, createPartnerInvite, deleteMyAccount } from "@/actions/account-actions";
import { btn } from "@/components/landing/styles";
import { Field, FormAlert } from "@/app/login/fields";
import { cn } from "@/lib/utils";
import { PreferencesForm } from "@/components/notifications/preferences-form";
import type { NotificationAudience, NotificationGroup } from "@/lib/notifications/catalog";
import type { NotificationPrefs } from "@/lib/notifications/preferences";

interface Member {
  id: string;
  name: string;
  email: string;
  isYou: boolean;
  since: string;
}
interface Invite {
  id: string;
  email: string | null;
  createdAt: string;
  expiresAt: string;
}

interface Props {
  kind: "couple" | "vendor" | "admin";
  account: { name: string; email: string; createdAt: string; companyName: string | null };
  wedding: { coupleNames: string; slug: string; members: Member[]; invites: Invite[] } | null;
  /** Chave pública do push (null com o push desligado no servidor). */
  pushPublicKey: string | null;
  /** Escolhas de avisos da conta e o que a tela oferece para este tipo de conta. */
  notifications: { prefs: NotificationPrefs; audience: NotificationAudience; groups: NotificationGroup[] };
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
const shortFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });

export function AccountSections({ kind, account, wedding, pushPublicKey, notifications }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {wedding ? <PartnerSection wedding={wedding} /> : null}
      <NotificationsSection pushPublicKey={pushPublicKey} notifications={notifications} />
      <PasswordSection />
      <DataSection kind={kind} createdAt={account.createdAt} companyName={account.companyName} coupleNames={wedding?.coupleNames ?? null} />
      {kind !== "admin" ? <DeleteSection kind={kind} isLastMember={wedding ? wedding.members.length <= 1 : false} /> : null}
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  description,
  tone = "default",
  children,
}: {
  id: string;
  icon: typeof Lock;
  title: string;
  description: ReactNode;
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className={cn(
        "scroll-mt-24 flex flex-col gap-5 rounded-[20px] border bg-papel p-5 shadow-[var(--shadow-aceito-1)] sm:p-7",
        tone === "danger" ? "border-perigo/25" : "border-linha",
      )}
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-[12px]",
            tone === "danger" ? "bg-perigo-suave text-perigo" : "bg-ameixa-suave text-ameixa",
          )}
        >
          <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-titulo`} className="font-display text-2xl leading-8 text-tinta">
            {title}
          </h2>
          <p className="mt-0.5 text-[15px] leading-[22px] text-tinta-suave">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? "Ocultar senhas" : "Mostrar senhas"}
      aria-pressed={show}
      className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-[10px] text-tinta-suave transition-colors hover:bg-areia hover:text-tinta"
    >
      {show ? <EyeOff aria-hidden="true" className="size-[18px]" strokeWidth={1.75} /> : <Eye aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />}
    </button>
  );
}

// ---------------------------------------------------------------------------

function NotificationsSection({ pushPublicKey, notifications }: Pick<Props, "pushPublicKey" | "notifications">) {
  return (
    <Section
      id="avisos"
      icon={Bell}
      title="Avisos"
      description="Escolha como e quando o Aceito avisa você. O sino no topo guarda tudo, aconteça o que acontecer."
    >
      <PreferencesForm initial={notifications.prefs} audience={notifications.audience} groups={notifications.groups} pushPublicKey={pushPublicKey} />
    </Section>
  );
}

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const found: typeof errors = {};
    if (!current) found.current = "Informe a senha atual.";
    if (next.length < 8) found.next = "Use pelo menos 8 caracteres.";
    else if (next !== confirm) found.confirm = "As senhas novas não conferem.";
    setErrors(found);
    const first = (["current", "next", "confirm"] as const).find((k) => found[k]);
    if (first) {
      document.getElementById(`senha-${first}`)?.focus();
      return;
    }
    startTransition(async () => {
      const res = await changePassword({ currentPassword: current, newPassword: next, confirm });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Senha trocada.");
    });
  };

  return (
    <Section id="senha" icon={KeyRound} title="Senha" description="Troque a senha de acesso. Use uma que você não usa em outros sites.">
      <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
        <Field
          id="senha-current"
          label="Senha atual"
          icon={Lock}
          error={errors.current}
          className="sm:col-span-2"
          trailing={<PasswordToggle show={show} onToggle={() => setShow((v) => !v)} />}
        >
          {(c) => (
            <input {...c} id="senha-current" type={show ? "text" : "password"} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          )}
        </Field>
        <Field id="senha-next" label="Nova senha" icon={Lock} error={errors.next} hint="Pelo menos 8 caracteres.">
          {(c) => <input {...c} id="senha-next" type={show ? "text" : "password"} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />}
        </Field>
        <Field id="senha-confirm" label="Repita a nova senha" icon={Lock} error={errors.confirm}>
          {(c) => (
            <input {...c} id="senha-confirm" type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          )}
        </Field>
        {error ? (
          <div className="sm:col-span-2">
            <FormAlert>{error}</FormAlert>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <button type="submit" disabled={isPending} className={cn(btn.primary, "min-h-12")}>
            {isPending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
            Trocar senha
          </button>
        </div>
      </form>
    </Section>
  );
}

// ---------------------------------------------------------------------------

function PartnerSection({ wedding }: { wedding: NonNullable<Props["wedding"]> }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ url: string; email: string | null; emailSent: boolean; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [cancelling, setCancelling] = useState<string | null>(null);

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const value = email.trim().toLowerCase();
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("Confira o e-mail.");
      document.getElementById("convite-email")?.focus();
      return;
    }
    setEmailError("");
    startTransition(async () => {
      const res = await createPartnerInvite({ email: value });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setCreated({ url: `${window.location.origin}${res.path}`, email: res.email, emailSent: res.emailSent, expiresAt: res.expiresAt });
      setCopied(false);
      setEmail("");
      router.refresh();
    });
  };

  const copy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não deu para copiar. Selecione o link e copie manualmente.");
    }
  };

  const cancel = (id: string) => {
    setCancelling(id);
    startTransition(async () => {
      const res = await cancelPartnerInvite(id);
      setCancelling(null);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Convite cancelado.");
      router.refresh();
    });
  };

  const whatsappText = created
    ? `Oi! Estou organizando o nosso casamento no Aceito e quero você junto. Entre pelo link (vale por 7 dias): ${created.url}`
    : "";

  return (
    <Section
      id="par"
      icon={UserPlus}
      title="Convidar seu par"
      description={`Quem entrar pelo convite organiza ${wedding.coupleNames} com você, com a própria conta e senha.`}
    >
      {/* Membros */}
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-tinta">
          <Users aria-hidden="true" className="size-4 text-tinta-suave" />
          Quem organiza
        </p>
        <ul className="divide-y divide-linha rounded-[12px] border border-linha">
          {wedding.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-ameixa-suave font-display text-ameixa">
                {m.name.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-tinta">
                  {m.name}
                  {m.isYou ? <span className="font-normal text-tinta-suave"> (você)</span> : null}
                </span>
                <span className="block truncate text-sm text-tinta-suave">{m.email}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Novo convite */}
      <form onSubmit={create} noValidate className="flex flex-col gap-4">
        <Field
          id="convite-email"
          label="E-mail do seu par"
          icon={Mail}
          optional
          error={emailError}
          hint="Com o e-mail, mandamos o convite por lá também. Sem ele, é só copiar o link."
        >
          {(c) => (
            <input
              {...c}
              id="convite-email"
              type="email"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="par@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
        {error ? <FormAlert>{error}</FormAlert> : null}
        <div>
          <button type="submit" disabled={isPending} className={cn(btn.primary, "min-h-12")}>
            {isPending && !cancelling ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
            Criar convite
          </button>
        </div>
      </form>

      {created ? (
        <div className="step-in flex flex-col gap-3 rounded-[16px] border border-ameixa/30 bg-ameixa-suave/50 p-4" aria-live="polite">
          <p className="text-sm font-semibold text-tinta">
            Convite criado. Vale até {dateFmt.format(new Date(created.expiresAt))}.
            {created.email
              ? created.emailSent
                ? ` Enviamos também para ${created.email}.`
                : ` Não conseguimos enviar o e-mail agora: mande o link abaixo.`
              : null}
          </p>
          <div className="flex items-center gap-2 rounded-[12px] border border-linha bg-papel p-1.5 pl-3">
            <input
              readOnly
              aria-label="Link do convite"
              value={created.url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 bg-transparent font-mono text-sm text-tinta outline-none"
            />
            <button type="button" onClick={copy} className={cn(btn.quiet, btn.sm, "shrink-0")}>
              {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(btn.secondary, "min-h-11 self-start")}
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Enviar pelo WhatsApp
          </a>
          <p className="text-sm text-tinta-suave">Por segurança, o link aparece só agora. Se perder, crie outro convite.</p>
        </div>
      ) : null}

      {/* Pendentes */}
      {wedding.invites.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-tinta">Convites pendentes</p>
          <ul className="divide-y divide-linha rounded-[12px] border border-linha">
            {wedding.invites.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-tinta">{i.email ?? "Convite por link"}</span>
                  <span className="block text-sm text-tinta-suave">
                    Criado em {shortFmt.format(new Date(i.createdAt))} · vence em {shortFmt.format(new Date(i.expiresAt))}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => cancel(i.id)}
                  disabled={isPending}
                  className={cn(btn.quiet, btn.sm, "shrink-0 text-perigo hover:bg-perigo-suave")}
                >
                  {cancelling === i.id ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <X aria-hidden="true" className="size-4" />}
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Section>
  );
}

// ---------------------------------------------------------------------------

function DataSection({
  kind,
  createdAt,
  companyName,
  coupleNames,
}: {
  kind: Props["kind"];
  createdAt: string;
  companyName: string | null;
  coupleNames: string | null;
}) {
  const what =
    kind === "vendor"
      ? `seu perfil${companyName ? ` (${companyName})` : ""}, pedidos de orçamento, avaliações e agenda`
      : coupleNames
        ? `o casamento ${coupleNames}: convidados, site, presentes, finanças e tarefas`
        : "os dados da sua conta";

  return (
    <Section
      id="dados"
      icon={ShieldCheck}
      title="Seus dados"
      description={
        <>
          Conta criada em {dateFmt.format(new Date(createdAt))}. Baixe uma cópia de tudo o que guardamos: dados da conta e {what}.
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <a href="/api/conta/exportar" download className={cn(btn.secondary, "min-h-12")}>
          <Download aria-hidden="true" className="size-4" />
          Baixar meus dados (JSON)
        </a>
        <a href="/privacidade" target="_blank" className="text-[15px] font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 hover:decoration-ameixa">
          Política de privacidade
        </a>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------

function DeleteSection({ kind, isLastMember }: { kind: Props["kind"]; isLastMember: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const consequence =
    kind === "vendor"
      ? "Seu perfil sai da vitrine e os pedidos, avaliações e a agenda são apagados."
      : isLastMember
        ? "Você é a única pessoa no casamento: ele será apagado junto, com convidados, site, presentes e finanças."
        : "O casamento continua com quem mais organiza; só a sua conta sai.";

  const ready = confirmation.trim().toUpperCase() === "EXCLUIR" && password.length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setError("");
    startTransition(async () => {
      const res = await deleteMyAccount({ confirmation, password });
      if (!res.success) {
        setError(res.error);
        return;
      }
      window.location.href = "/";
    });
  };

  return (
    <Section id="excluir" icon={Trash2} tone="danger" title="Excluir conta" description={`Apaga a sua conta de vez. ${consequence} Não dá para desfazer.`}>
      {!open ? (
        <div>
          <button type="button" onClick={() => setOpen(true)} className={cn(btn.secondary, "min-h-12 text-perigo hover:border-perigo hover:bg-perigo-suave")}>
            Quero excluir minha conta
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="step-in grid gap-5 sm:grid-cols-2">
          <Field id="excluir-confirmacao" label='Digite "EXCLUIR" para confirmar'>
            {(c) => (
              <input
                {...c}
                id="excluir-confirmacao"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            )}
          </Field>
          <Field id="excluir-senha" label="Sua senha" icon={Lock} trailing={<PasswordToggle show={show} onToggle={() => setShow((v) => !v)} />}>
            {(c) => (
              <input {...c} id="excluir-senha" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            )}
          </Field>
          {error ? (
            <div className="sm:col-span-2">
              <FormAlert>{error}</FormAlert>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={!ready || isPending}
              className={cn(btn.primary, "min-h-12 bg-perigo hover:bg-perigo/90 hover:shadow-none")}
            >
              {isPending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Trash2 aria-hidden="true" className="size-4" />}
              Excluir minha conta
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmation("");
                setPassword("");
                setError("");
              }}
              className={cn(btn.quiet, "min-h-12")}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </Section>
  );
}
