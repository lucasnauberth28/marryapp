"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, CheckCircle2, Clock, Copy, Eye, Link2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  connectDomainAction,
  markDomainOnlineAction,
  markDomainRegisteredAction,
  markDomainRenewedAction,
  rejectDomainOrderAction,
  revealDomainHolderDocumentAction,
  saveDomainNoteAction,
  startDomainRegistrationAction,
  verifyDomainAction,
  type AdminResult,
  type ConnectResult,
} from "@/actions/domain-admin-actions";
import { btn } from "@/components/landing/styles";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/plataforma/status-chip";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TIMELINE_STEPS, timelineStates, type DomainOrderStatusName } from "@/lib/domain-order";
import type { ConnectionResult } from "@/lib/vercel-domains-core";
import { cn } from "@/lib/utils";

export interface DomainPanelData {
  id: string;
  domain: string;
  status: DomainOrderStatusName;
  holderDocument: string;
  canRevealDocument: boolean;
  adminNote: string | null;
  vercelState: string | null;
  canRenew: boolean;
}

const DANGER = "border-perigo text-perigo hover:border-perigo hover:bg-perigo-suave";

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
function plusOneYear(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

async function copyText(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error("Não foi possível copiar. Selecione e copie à mão.");
  }
}

/** Texto honesto da última situação lida da Vercel (sem inventar horário: só guardamos a situação). */
export function vercelStateText(state: string | null): string | null {
  if (!state) return null;
  if (state === "ready") return "A Vercel confirmou: domínio verificado e apontado.";
  if (state === "pending_dns") return "A Vercel ainda não encontra o DNS apontado. A propagação pode levar até 48 horas.";
  if (state === "pending_verification") return "A Vercel pede o registro TXT de verificação.";
  if (state === "manual") return "Marcado como no ar à mão.";
  if (state.startsWith("erro:")) return "A última tentativa de falar com a Vercel falhou.";
  return `Situação na Vercel: ${state}`;
}

/** Painel do pedido de domínio: etapas, DNS que a Vercel devolve e as ações da equipe (todas auditadas no servidor). */
export function DomainPanel({ order, vercelReady }: { order: DomainPanelData; vercelReady: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [panel, setPanel] = useState<"registered" | "reject" | "online" | null>(null);
  const [registeredAt, setRegisteredAt] = useState(today);
  const [expiresAt, setExpiresAt] = useState(() => plusOneYear(today()));
  const [reason, setReason] = useState("");
  const [note, setNote] = useState(order.adminNote ?? "");
  const [connection, setConnection] = useState<ConnectionResult | null>(null);
  const [fullDocument, setFullDocument] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Qual ação está rodando: só o botão clicado mostra o spinner, os outros ficam desabilitados
  const [running, setRunning] = useState<string | null>(null);
  const id = order.id;
  const states = timelineStates(order.status);

  function run(key: string, action: () => Promise<AdminResult | ConnectResult>, afterOk?: () => void) {
    setError(null);
    setRunning(key);
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

  const stateText = vercelStateText(order.vercelState);

  return (
    <div className="flex flex-col gap-5">
      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      ) : null}

      {/* Documento: escondido; o completo só sai por ação auditada, enquanto o pedido está aberto */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-tinta-suave">Documento do titular</p>
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-mono tabular-nums text-tinta">{fullDocument ?? order.holderDocument}</span>
          {order.canRevealDocument && !fullDocument ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={pending && running === "reveal"}
              disabled={pending}
              onClick={() => {
                setRunning("reveal");
                startTransition(async () => {
                  const res = await revealDomainHolderDocumentAction(id);
                  if (res.success) setFullDocument(res.document);
                  else toast.error(res.error);
                });
              }}
            >
              <Eye className="size-4" aria-hidden="true" /> Mostrar completo
            </Button>
          ) : null}
          {fullDocument ? (
            <button type="button" onClick={() => copyText(fullDocument.replace(/[^0-9A-Z]/g, ""), "Número copiado (só os dígitos).")} className={cn(btn.secondary, btn.sm)}>
              <Copy className="size-4" aria-hidden="true" /> Copiar
            </button>
          ) : null}
        </p>
        {order.canRevealDocument ? <p className="text-xs text-tinta-suave">Cada vez que o número completo é mostrado, fica no registro de atividades.</p> : null}
      </div>

      {states ? (
        <ol className="flex flex-col gap-2" aria-label="Etapas do pedido">
          {TIMELINE_STEPS.map((step, i) => {
            const state = states[i];
            return (
              <li key={step.status} className="flex items-center gap-3 text-[15px]">
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                    state === "done" ? "bg-sucesso text-papel" : state === "todo" ? "border border-linha-forte text-tinta-suave" : "bg-ameixa text-on-ameixa",
                  )}
                  aria-hidden="true"
                >
                  {state === "done" ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className={state === "todo" ? "text-tinta-suave" : "font-semibold text-tinta"}>
                  {step.title}
                  <span className="sr-only">{state === "done" ? " (feito)" : state === "todo" ? " (depois)" : " (agora)"}</span>
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}

      {order.status === "REGISTERED" || order.status === "CONNECTED" ? (
        <section aria-label="Registros de DNS" className="flex flex-col gap-3 border-t border-linha pt-4">
          <h3 className="text-[15px] font-semibold text-tinta">Registros de DNS para configurar</h3>
          {!vercelReady ? (
            <p className="rounded-xl bg-areia p-3 text-sm text-tinta">
              Vercel não configurada (faltam VERCEL_API_TOKEN e VERCEL_PROJECT_ID). Sem ela não temos os registros reais para mostrar: adicione o domínio na Vercel à mão e use &quot;Marcar como no ar&quot;.
            </p>
          ) : connection ? (
            <ConnectionPanel connection={connection} />
          ) : (
            <p className="text-sm text-tinta-suave">Use &quot;Conectar à Vercel&quot; ou &quot;Verificar DNS&quot; para ver os registros que a Vercel pede para este domínio.</p>
          )}
          {stateText ? (
            <p className="flex items-start gap-2 rounded-xl bg-areia p-3 text-sm text-tinta">
              <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {stateText}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Ações por situação */}
      {order.status === "REQUESTED" ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={pending} loading={pending && running === "start"} onClick={() => run("start", () => startDomainRegistrationAction(id))}>
            Começar o registro
          </Button>
        </div>
      ) : null}
      {order.status === "REGISTERING" ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={pending} onClick={() => setPanel(panel === "registered" ? null : "registered")}>
            Marcar como registrado
          </Button>
        </div>
      ) : null}
      {order.status === "REGISTERED" ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={pending || !vercelReady} loading={pending && running === "connect"} onClick={() => run("connect", () => connectDomainAction(id))}>
            <Link2 className="size-4" aria-hidden="true" /> Conectar à Vercel
          </Button>
          <Button type="button" variant="outline" disabled={pending || !vercelReady} loading={pending && running === "verify"} onClick={() => run("verify", () => verifyDomainAction(id))}>
            <RefreshCw className="size-4" aria-hidden="true" /> Verificar DNS
          </Button>
          <Button type="button" variant="outline" disabled={pending} onClick={() => setPanel(panel === "online" ? null : "online")}>
            Marcar como no ar
          </Button>
        </div>
      ) : null}
      {order.canRenew ? (
        <div>
          <Button type="button" variant="outline" disabled={pending} loading={pending && running === "renew"} onClick={() => run("renew", () => markDomainRenewedAction(id))}>
            Marcar como renovado (mais 1 ano)
          </Button>
          <p className="mt-1 text-xs text-tinta-suave">Use depois de renovar no Registro.br. O vencimento sobe 1 ano e os avisos de 60 e 30 dias voltam a valer.</p>
        </div>
      ) : null}

      {panel === "registered" ? (
        <form
          className="flex flex-col gap-3 rounded-xl bg-areia p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run("register", () => markDomainRegisteredAction({ orderId: id, registeredAt, expiresAt }), () => setPanel(null));
          }}
        >
          <p className="text-sm text-tinta">Ao confirmar, o CPF/CNPJ completo é trocado pela versão escondida e o casal é avisado.</p>
          <Input
            label="Data do registro"
            type="date"
            value={registeredAt}
            onChange={(e) => {
              setRegisteredAt(e.target.value);
              if (e.target.value) setExpiresAt(plusOneYear(e.target.value));
            }}
            required
          />
          <Input label="Vencimento (1 ano depois)" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} required />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending} loading={pending && running === "register"}>
              Confirmar registro
            </Button>
            <Button type="button" variant="quiet" onClick={() => setPanel(null)} disabled={pending}>
              Voltar
            </Button>
          </div>
        </form>
      ) : null}

      {order.status === "REQUESTED" || order.status === "REGISTERING" ? (
        <section aria-label="Recusar o pedido" className="flex flex-col gap-3 border-t border-linha pt-4">
          <h3 className="text-[15px] font-semibold text-tinta">Recusar o pedido</h3>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              run("reject", () => rejectDomainOrderAction({ orderId: id, reason }), () => setReason(""));
            }}
          >
            <Textarea label="Motivo da recusa" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} hint="O casal recebe este texto por e-mail." />
            <Button type="submit" variant="outline" disabled={reason.trim().length < 5 || pending} loading={pending && running === "reject"} className={cn(DANGER, "self-start")}>
              Recusar com motivo
            </Button>
          </form>
        </section>
      ) : null}

      <ConfirmModal
        isOpen={panel === "online"}
        onClose={() => setPanel(null)}
        onConfirm={() => run("online", () => markDomainOnlineAction(id), () => setPanel(null))}
        title="Marcar como no ar?"
        description={`Confirme só se ${order.domain} já abre o site do casal. A partir daí os links dos convidados passam a usar este endereço e o casal é avisado.`}
        confirmText="Marcar como no ar"
        cancelText="Voltar"
        variant="default"
        isLoading={pending}
      />

      <form
        className="flex flex-col gap-2 border-t border-linha pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          run("note", () => saveDomainNoteAction({ orderId: id, note }));
        }}
      >
        <Textarea label="Anotação da equipe" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} hint="O casal não vê." />
        <Button type="submit" variant="outline" size="sm" disabled={note === (order.adminNote ?? "") || pending} loading={pending && running === "note"} className="self-start">
          Salvar anotação
        </Button>
      </form>
    </div>
  );
}

const STATE_CHIP = {
  ready: { tone: "sucesso", label: "Verificado e apontado" },
  pending_dns: { tone: "aviso", label: "Falta o DNS" },
  pending_verification: { tone: "aviso", label: "Falta a verificação" },
} as const;

function ConnectionPanel({ connection }: { connection: ConnectionResult }) {
  if (!connection.ok) {
    return (
      <p role="status" className="rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
        {connection.message}
      </p>
    );
  }
  const chip = STATE_CHIP[connection.state];
  return (
    <div className="flex flex-col gap-3">
      <p className="flex flex-wrap items-center gap-2 text-sm text-tinta">
        <StatusChip tone={chip.tone} icon={connection.state === "ready" ? CheckCircle2 : Clock}>
          {chip.label}
        </StatusChip>
        {connection.message}
      </p>
      <ul className="flex flex-col gap-2">
        {connection.records.map((record) => (
          <li key={`${record.type}-${record.name}`} className="flex flex-col gap-1 rounded-xl border border-linha bg-papel p-3 text-sm">
            <span className="text-tinta-suave">
              Tipo {record.type} · nome <span className="font-mono">{record.name}</span>
            </span>
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 break-all font-mono text-tinta">{record.value}</span>
              <button type="button" onClick={() => copyText(record.value, "Valor copiado.")} className={cn(btn.secondary, btn.sm)}>
                <Copy className="size-4" aria-hidden="true" /> Copiar
              </button>
            </span>
            {record.source === "default" ? <span className="text-xs text-tinta-suave">Valor padrão da Vercel: a consulta não devolveu o recomendado. Confira em Domains no projeto.</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
