import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Mail, MessageCircle, Send, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { cancelarConviteDePessoaParceira, criarConviteDePessoaParceira } from "@/actions/account-actions";
import { estiloDoBotao } from "@/components/landing/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { Campo, AvisoDoFormulario } from "@/components/ui/field";
import { formatarDataBrasiliaLonga } from "@/lib/formatacao/data";
import { cn } from "@/lib/utils";
import { Secao } from "./secao";
import type { CasamentoDaConta } from "./tipos";

const formatoCurto = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });

type ConviteCriado = { url: string; email: string | null; emailSent: boolean; expiresAt: string };

function useConvitesDoPar() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState<ConviteCriado | null>(null);
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
      const res = await criarConviteDePessoaParceira({ email: value });
      if (!res.success) return setError(res.error);
      setCreated({ url: `${window.location.origin}${res.path}`, email: res.email, emailSent: res.emailSent, expiresAt: res.expiresAt });
      setEmail("");
      router.refresh();
    });
  };

  const cancel = (id: string) => {
    setCancelling(id);
    startTransition(async () => {
      const res = await cancelarConviteDePessoaParceira(id);
      setCancelling(null);
      if (!res.success) return void toast.error(res.error);
      toast.success("Convite cancelado.");
      router.refresh();
    });
  };

  return { email, setEmail, emailError, error, created, isPending, cancelling, create, cancel };
}

function QuemOrganiza({ members }: { members: CasamentoDaConta["members"] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 text-sm font-semibold text-tinta">
        <Users aria-hidden="true" className="size-4 text-tinta-suave" />
        Quem organiza
      </p>
      <ul className="divide-y divide-linha rounded-[12px] border border-linha">
        {members.map((m) => (
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
  );
}

function ConviteCriadoNaTela({ created }: { created: ConviteCriado }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(created.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não deu para copiar. Selecione o link e copie manualmente.");
    }
  };
  const whatsappText = `Oi! Estou organizando o nosso casamento no Aceito e quero você junto. Entre pelo link (vale por 7 dias): ${created.url}`;
  return (
    <div className="step-in flex flex-col gap-3 rounded-[16px] border border-ameixa/30 bg-ameixa-suave/50 p-4" aria-live="polite">
      <p className="text-sm font-semibold text-tinta">
        Convite criado. Vale até {formatarDataBrasiliaLonga(new Date(created.expiresAt))}.
        {created.email ? (created.emailSent ? ` Enviamos também para ${created.email}.` : ` Não conseguimos enviar o e-mail agora: mande o link abaixo.`) : null}
      </p>
      <div className="flex items-center gap-2 rounded-[12px] border border-linha bg-papel p-1.5 pl-3">
        <input readOnly aria-label="Link do convite" value={created.url} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 bg-transparent font-mono text-sm text-tinta outline-none" />
        <button type="button" onClick={copy} className={cn(estiloDoBotao.quiet, estiloDoBotao.sm, "shrink-0")}>
          {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <a href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noopener noreferrer" className={cn(estiloDoBotao.secondary, "min-h-11 self-start")}>
        <MessageCircle aria-hidden="true" className="size-4" />
        Enviar pelo WhatsApp
      </a>
      <p className="text-sm text-tinta-suave">Por segurança, o link aparece só agora. Se perder, crie outro convite.</p>
    </div>
  );
}

function ConvitesPendentes({ invites, cancelling, desabilitado, aoCancelar }: { invites: CasamentoDaConta["invites"]; cancelling: string | null; desabilitado: boolean; aoCancelar: (id: string) => void }) {
  if (invites.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-tinta">Convites pendentes</p>
      <ul className="divide-y divide-linha rounded-[12px] border border-linha">
        {invites.map((i) => (
          <li key={i.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] text-tinta">{i.email ?? "Convite por link"}</span>
              <span className="block text-sm text-tinta-suave">
                Criado em {formatoCurto.format(new Date(i.createdAt))} · vence em {formatoCurto.format(new Date(i.expiresAt))}
              </span>
            </span>
            <BotaoComCarregamento onClick={() => aoCancelar(i.id)} loading={cancelling === i.id} disabled={desabilitado} className={cn(estiloDoBotao.quiet, estiloDoBotao.sm, "shrink-0 text-perigo hover:bg-perigo-suave")}>
              <X aria-hidden="true" className="size-4" />
              Cancelar
            </BotaoComCarregamento>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SecaoDaPessoaParceira({ wedding }: { wedding: CasamentoDaConta }) {
  const c = useConvitesDoPar();
  return (
    <Secao id="par" icon={UserPlus} title="Convidar seu par" description={`Quem entrar pelo convite organiza ${wedding.coupleNames} com você, com a própria conta e senha.`}>
      <QuemOrganiza members={wedding.members} />

      <form onSubmit={c.create} noValidate className="flex flex-col gap-4">
        <Campo id="convite-email" label="E-mail do seu par" icon={Mail} optional error={c.emailError} hint="Com o e-mail, mandamos o convite por lá também. Sem ele, é só copiar o link.">
          {(campo) => <input {...campo} id="convite-email" type="email" autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="par@email.com" value={c.email} onChange={(e) => c.setEmail(e.target.value)} />}
        </Campo>
        {c.error ? <AvisoDoFormulario>{c.error}</AvisoDoFormulario> : null}
        <div>
          <BotaoComCarregamento type="submit" loading={c.isPending && !c.cancelling} disabled={c.isPending} className={cn(estiloDoBotao.primary, "min-h-12")}>
            <Send aria-hidden="true" className="size-4" />
            Criar convite
          </BotaoComCarregamento>
        </div>
      </form>

      {c.created ? <ConviteCriadoNaTela key={c.created.url} created={c.created} /> : null}
      <ConvitesPendentes invites={wedding.invites} cancelling={c.cancelling} desabilitado={c.isPending} aoCancelar={c.cancel} />
    </Secao>
  );
}
