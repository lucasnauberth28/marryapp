"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Clock, Copy, ExternalLink, Info, Loader2, XCircle } from "lucide-react";
import {
  connectDomainAction,
  markDomainOnlineAction,
  markDomainRegisteredAction,
  rejectDomainOrderAction,
  saveDomainNoteAction,
  startDomainRegistrationAction,
  verifyDomainAction,
  type AdminResult,
  type ConnectResult,
} from "@/actions/domain-admin-actions";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Chip, card, type ChipTone } from "@/components/casal/ui";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type DomainOrderStatusName } from "@/lib/domain-order";
import type { ConnectionResult, DnsRecord } from "@/lib/vercel-domains-core";

export interface AdminOrder {
  id: string;
  domain: string;
  status: DomainOrderStatusName;
  coupleNames: string;
  slug: string;
  planName: string | null;
  holderName: string;
  /** Número completo e formatado enquanto o pedido está aberto; depois, a versão escondida. */
  holderDocument: string;
  documentIsFull: boolean;
  holderEmail: string;
  holderPhone: string;
  adminNote: string | null;
  rejectionReason: string | null;
  requestedAt: string;
  registeredAt: string | null;
  expiresAt: string | null;
  connectedAt: string | null;
  vercelState: string | null;
  /** Dias até vencer (calculado no servidor); negativo se já venceu. */
  daysToExpire: number | null;
}

const dateTime = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
const calendar = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const STATUS_TONE: Record<DomainOrderStatusName, { tone: ChipTone; icon: typeof Clock }> = {
  REQUESTED: { tone: "aviso", icon: Clock },
  REGISTERING: { tone: "aviso", icon: Loader2 },
  REGISTERED: { tone: "salvia", icon: CheckCircle2 },
  CONNECTED: { tone: "sucesso", icon: CheckCircle2 },
  REJECTED: { tone: "perigo", icon: XCircle },
  CANCELED: { tone: "neutro", icon: XCircle },
};

/** Data de hoje em Brasília no formato do campo de data (AAAA-MM-DD). */
function todayBrasilia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}
function plusOneYear(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-sm font-semibold leading-5 text-tinta-suave">{label}</dt>
      <dd className="min-w-0 break-words text-[15px] leading-6 text-tinta">{children}</dd>
    </div>
  );
}

async function copyText(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error("Não foi possível copiar. Selecione e copie à mão.");
  }
}

export function DomainOrderCard({ order, vercelReady }: { order: AdminOrder; vercelReady: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [panel, setPanel] = useState<"registered" | "reject" | "online" | null>(null);
  const [registeredAt, setRegisteredAt] = useState(todayBrasilia);
  const [expiresAt, setExpiresAt] = useState(() => plusOneYear(todayBrasilia()));
  const [reason, setReason] = useState("");
  const [note, setNote] = useState(order.adminNote ?? "");
  const [connection, setConnection] = useState<ConnectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = STATUS_TONE[order.status];
  const id = order.id;

  function run(action: () => Promise<AdminResult | ConnectResult>, afterOk?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        if (result.message) toast.success(result.message);
        if ("connection" in result) setConnection(result.connection);
        afterOk?.();
        router.refresh();
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  const daysToExpire = order.daysToExpire;

  return (
    <article aria-labelledby={`dom-${id}`} className={cn(card, "flex flex-col gap-4 p-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`dom-${id}`} className="break-all font-display text-[26px] leading-8 text-tinta">
            {order.domain}
          </h2>
          <p className="text-sm text-tinta-suave">
            {order.coupleNames} · pedido em {dateTime.format(new Date(order.requestedAt)).replace(/\./g, "")}
          </p>
        </div>
        <Chip tone={status.tone} icon={status.icon}>
          {STATUS_LABEL[order.status]}
        </Chip>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <Fact label="Titular">{order.holderName}</Fact>
        <Fact label={order.documentIsFull ? "CPF ou CNPJ (completo)" : "CPF ou CNPJ (escondido)"}>
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-mono tabular-nums">{order.holderDocument}</span>
            {order.documentIsFull ? (
              <Button type="button" size="sm" variant="outline" onClick={() => copyText(order.holderDocument.replace(/[^0-9A-Z]/g, ""), "Número copiado (só os dígitos).")}>
                <Copy aria-hidden="true" /> Copiar
              </Button>
            ) : null}
          </span>
        </Fact>
        <Fact label="E-mail do titular">{order.holderEmail}</Fact>
        <Fact label="Telefone">{order.holderPhone}</Fact>
        <Fact label="Casamento">
          <a href={`/casamento/${order.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 font-semibold text-ameixa underline-offset-4 hover:underline sm:min-h-0">
            {order.coupleNames}
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span className="sr-only"> (abre em outra aba)</span>
          </a>
        </Fact>
        <Fact label="Plano">{order.planName ?? "Sem assinatura (casamento principal ou administração)"}</Fact>
        {order.registeredAt ? <Fact label="Registrado em">{calendar.format(new Date(order.registeredAt)).replace(/\./g, "")}</Fact> : null}
        {order.expiresAt ? (
          <Fact label="Vence em">
            {calendar.format(new Date(order.expiresAt)).replace(/\./g, "")}
            {daysToExpire !== null && daysToExpire <= 60 ? (
              <span className="ml-2 font-semibold text-aviso">{daysToExpire < 0 ? "vencido" : `faltam ${daysToExpire} dias`}</span>
            ) : null}
          </Fact>
        ) : null}
        {order.connectedAt ? <Fact label="No ar desde">{dateTime.format(new Date(order.connectedAt)).replace(/\./g, "")}</Fact> : null}
        {order.rejectionReason ? <Fact label="Motivo da recusa">{order.rejectionReason}</Fact> : null}
        {order.vercelState ? <Fact label="Situação na Vercel">{order.vercelState}</Fact> : null}
      </dl>

      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      ) : null}

      {connection ? <ConnectionPanel connection={connection} domain={order.domain} /> : null}

      {/* Ações por situação */}
      {order.status === "REQUESTED" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" disabled={pending} onClick={() => run(() => startDomainRegistrationAction(id))}>
            Começar o registro
          </Button>
          <Button type="button" variant="danger" disabled={pending} onClick={() => setPanel(panel === "reject" ? null : "reject")}>
            Recusar
          </Button>
        </div>
      ) : null}

      {order.status === "REGISTERING" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" disabled={pending} onClick={() => setPanel(panel === "registered" ? null : "registered")}>
            Marcar como registrado
          </Button>
          <Button type="button" variant="danger" disabled={pending} onClick={() => setPanel(panel === "reject" ? null : "reject")}>
            Recusar
          </Button>
        </div>
      ) : null}

      {order.status === "REGISTERED" ? (
        <div className="flex flex-col gap-3">
          {!vercelReady ? (
            <p className="flex items-start gap-2 rounded-xl bg-areia p-3 text-sm text-tinta">
              <Info className="mt-0.5 size-4 shrink-0 text-tinta-suave" aria-hidden="true" />A conexão automática com a Vercel não está configurada (faltam VERCEL_API_TOKEN e VERCEL_PROJECT_ID). Adicione o domínio na Vercel à mão e use &quot;Marcar como no ar&quot;.
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" disabled={pending || !vercelReady} onClick={() => run(() => connectDomainAction(id))}>
              Conectar ao site
            </Button>
            <Button type="button" variant="outline" disabled={pending || !vercelReady} onClick={() => run(() => verifyDomainAction(id))}>
              Verificar agora
            </Button>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setPanel(panel === "online" ? null : "online")}>
              Marcar como no ar
            </Button>
          </div>
        </div>
      ) : null}

      {panel === "registered" ? (
        <form
          className="flex flex-col gap-3 rounded-xl bg-areia p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => markDomainRegisteredAction({ orderId: id, registeredAt, expiresAt }), () => setPanel(null));
          }}
        >
          <p className="text-sm text-tinta">Ao confirmar, o CPF/CNPJ completo é trocado pela versão escondida e o casal é avisado.</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input id={`reg-${id}`} label="Data do registro" type="date" value={registeredAt} onChange={(e) => { setRegisteredAt(e.target.value); if (e.target.value) setExpiresAt(plusOneYear(e.target.value)); }} required />
            <Input id={`exp-${id}`} label="Vencimento (1 ano depois)" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Confirmar registro"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setPanel(null)}>
              Voltar
            </Button>
          </div>
        </form>
      ) : null}

      {panel === "reject" ? (
        <form
          className="flex flex-col gap-3 rounded-xl bg-perigo-suave/60 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => rejectDomainOrderAction({ orderId: id, reason }), () => setPanel(null));
          }}
        >
          <Textarea id={`rej-${id}`} label="Motivo (o casal vai ler)" hint="Explique em poucas palavras, por exemplo: o nome não está disponível no Registro.br." value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} required />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" variant="danger" disabled={pending || reason.trim().length < 5}>
              {pending ? "Recusando…" : "Recusar o pedido"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setPanel(null)}>
              Voltar
            </Button>
          </div>
        </form>
      ) : null}

      <ConfirmModal
        isOpen={panel === "online"}
        onClose={() => setPanel(null)}
        onConfirm={() => run(() => markDomainOnlineAction(id), () => setPanel(null))}
        title="Marcar como no ar?"
        description={`Confirme só se ${order.domain} já abre o site do casal. A partir daí os links dos convidados passam a usar este endereço e o casal é avisado.`}
        confirmText="Marcar como no ar"
        cancelText="Voltar"
        variant="default"
        isLoading={pending}
      />

      {/* Anotação interna */}
      <form
        className="flex flex-col gap-2 border-t border-linha pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveDomainNoteAction({ orderId: id, note }));
        }}
      >
        <Textarea id={`nota-${id}`} label="Anotação da equipe" hint="O casal não vê." value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} />
        <div>
          <Button type="submit" size="sm" variant="outline" disabled={pending || note === (order.adminNote ?? "")}>
            Salvar anotação
          </Button>
        </div>
      </form>
    </article>
  );
}

const STATE_TEXT: Record<string, { tone: ChipTone; label: string }> = {
  ready: { tone: "sucesso", label: "Verificado e apontado" },
  pending_dns: { tone: "aviso", label: "Falta o DNS" },
  pending_verification: { tone: "aviso", label: "Falta a verificação" },
};

function ConnectionPanel({ connection, domain }: { connection: ConnectionResult; domain: string }) {
  if (!connection.ok) {
    return (
      <p role="status" className="rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
        {connection.message}
      </p>
    );
  }
  const state = STATE_TEXT[connection.state];
  return (
    <section aria-label={`Registros DNS de ${domain}`} className="flex flex-col gap-3 rounded-xl border border-linha p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={state.tone} icon={connection.state === "ready" ? CheckCircle2 : Clock}>
          {state.label}
        </Chip>
        <p className="text-sm text-tinta">{connection.message}</p>
      </div>
      <p className="text-sm text-tinta-suave">
        Registros para criar na zona DNS de <strong className="font-semibold text-tinta">{domain}</strong> (no Registro.br ou com o titular):
      </p>
      <ul className="flex flex-col gap-2">
        {connection.records.map((record) => (
          <RecordRow key={`${record.type}-${record.name}`} record={record} />
        ))}
      </ul>
      {connection.records.some((r) => r.source === "default") ? (
        <p className="text-xs text-tinta-suave">Valores marcados como padrão não vieram da Vercel nesta consulta. Confira em Domains no painel do projeto.</p>
      ) : null}
    </section>
  );
}

function RecordRow({ record }: { record: DnsRecord }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-areia px-3 py-2 text-sm">
      <span className="w-14 font-semibold text-tinta">{record.type}</span>
      <span className="min-w-0 break-all font-mono text-tinta">{record.name}</span>
      <span className="min-w-0 flex-1 break-all font-mono text-tinta">{record.value}</span>
      {record.source === "default" ? <span className="text-xs text-tinta-suave">padrão</span> : null}
      <Button type="button" size="sm" variant="outline" onClick={() => copyText(record.value, "Valor copiado.")}>
        <Copy aria-hidden="true" /> Copiar
      </Button>
    </li>
  );
}
