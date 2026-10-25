"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, CheckCircle2, Clock, Copy, Eye, Link2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  conectarDominioAcao,
  marcarDominioComoNoAr,
  marcarDominioComoRegistrado,
  marcarDominioComoRenovado,
  recusarPedidoDeDominio,
  revelarDocumentoDoTitularDoDominio,
  salvarNotaDoDominio,
  iniciarRegistroDoDominio,
  verificarDominioAcao,
  type ResultadoDaAcaoDeAdmin,
  type ResultadoDaAcaoDeConectarDominio,
} from "@/actions/domain-admin-actions";
import { estiloDoBotao } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { ETAPAS_DA_LINHA_DO_TEMPO, situacoesDasEtapas, type NomeDaSituacaoDoPedidoDeDominio } from "@/lib/domain-order";
import type { ResultadoDaConexao } from "@/lib/vercel-domains-core";
import { cn } from "@/lib/utils";

export interface DadosDoPainelDoDominio {
  id: string;
  domain: string;
  status: NomeDaSituacaoDoPedidoDeDominio;
  holderDocument: string;
  canRevealDocument: boolean;
  adminNote: string | null;
  vercelState: string | null;
  canRenew: boolean;
}

const ESTILO_DE_PERIGO = "border-perigo text-perigo hover:border-perigo hover:bg-perigo-suave";

const hojeNoFormulario = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
function maisUmAno(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

async function copiarTexto(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error("Não foi possível copiar. Selecione e copie à mão.");
  }
}

/** Texto honesto da última situação lida da Vercel (sem inventar horário: só guardamos a situação). */
function textoDaSituacaoNaVercel(state: string | null): string | null {
  if (!state) return null;
  if (state === "ready") return "A Vercel confirmou: domínio verificado e apontado.";
  if (state === "pending_dns") return "A Vercel ainda não encontra o DNS apontado. A propagação pode levar até 48 horas.";
  if (state === "pending_verification") return "A Vercel pede o registro TXT de verificação.";
  if (state === "manual") return "Marcado como no ar à mão.";
  if (state.startsWith("erro:")) return "A última tentativa de falar com a Vercel falhou.";
  return `Situação na Vercel: ${state}`;
}

/** Painel do pedido de domínio: etapas, DNS que a Vercel devolve e as ações da equipe (todas auditadas no servidor). */
export function PainelDoDominio({ order, vercelReady }: { order: DadosDoPainelDoDominio; vercelReady: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [panel, setPanel] = useState<"registered" | "reject" | "online" | null>(null);
  const [registeredAt, setRegisteredAt] = useState(hojeNoFormulario);
  const [expiresAt, setExpiresAt] = useState(() => maisUmAno(hojeNoFormulario()));
  const [reason, setReason] = useState("");
  const [note, setNote] = useState(order.adminNote ?? "");
  const [connection, setConnection] = useState<ResultadoDaConexao | null>(null);
  const [fullDocument, setFullDocument] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Qual ação está rodando: só o botão clicado mostra o spinner, os outros ficam desabilitados
  const [running, setRunning] = useState<string | null>(null);
  const id = order.id;
  const states = situacoesDasEtapas(order.status);

  function run(key: string, action: () => Promise<ResultadoDaAcaoDeAdmin | ResultadoDaAcaoDeConectarDominio>, afterOk?: () => void) {
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

  const stateText = textoDaSituacaoNaVercel(order.vercelState);

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
            <Botao
              type="button"
              variant="outline"
              size="sm"
              loading={pending && running === "reveal"}
              disabled={pending}
              onClick={() => {
                setRunning("reveal");
                startTransition(async () => {
                  const res = await revelarDocumentoDoTitularDoDominio(id);
                  if (res.success) setFullDocument(res.document);
                  else toast.error(res.error);
                });
              }}
            >
              <Eye className="size-4" aria-hidden="true" /> Mostrar completo
            </Botao>
          ) : null}
          {fullDocument ? (
            <button type="button" onClick={() => copiarTexto(fullDocument.replace(/[^0-9A-Z]/g, ""), "Número copiado (só os dígitos).")} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm)}>
              <Copy className="size-4" aria-hidden="true" /> Copiar
            </button>
          ) : null}
        </p>
        {order.canRevealDocument ? <p className="text-xs text-tinta-suave">Cada vez que o número completo é mostrado, fica no registro de atividades.</p> : null}
      </div>

      {states ? (
        <ol className="flex flex-col gap-2" aria-label="Etapas do pedido">
          {ETAPAS_DA_LINHA_DO_TEMPO.map((step, i) => {
            const state = states[i];
            return (
              <li key={step.status} className="flex items-center gap-3 text-[15px]">
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                    state === "done" ? "bg-sucesso text-on-ameixa" : state === "todo" ? "border border-linha-forte text-tinta-suave" : "bg-ameixa text-on-ameixa",
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
            <PainelDaConexao connection={connection} />
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
          <Botao type="button" disabled={pending} loading={pending && running === "start"} onClick={() => run("start", () => iniciarRegistroDoDominio(id))}>
            Começar o registro
          </Botao>
        </div>
      ) : null}
      {order.status === "REGISTERING" ? (
        <div className="flex flex-wrap gap-2">
          <Botao type="button" disabled={pending} onClick={() => setPanel(panel === "registered" ? null : "registered")}>
            Marcar como registrado
          </Botao>
        </div>
      ) : null}
      {order.status === "REGISTERED" ? (
        <div className="flex flex-wrap gap-2">
          <Botao type="button" disabled={pending || !vercelReady} loading={pending && running === "connect"} onClick={() => run("connect", () => conectarDominioAcao(id))}>
            <Link2 className="size-4" aria-hidden="true" /> Conectar à Vercel
          </Botao>
          <Botao type="button" variant="outline" disabled={pending || !vercelReady} loading={pending && running === "verify"} onClick={() => run("verify", () => verificarDominioAcao(id))}>
            <RefreshCw className="size-4" aria-hidden="true" /> Verificar DNS
          </Botao>
          <Botao type="button" variant="outline" disabled={pending} onClick={() => setPanel(panel === "online" ? null : "online")}>
            Marcar como no ar
          </Botao>
        </div>
      ) : null}
      {order.canRenew ? (
        <div>
          <Botao type="button" variant="outline" disabled={pending} loading={pending && running === "renew"} onClick={() => run("renew", () => marcarDominioComoRenovado(id))}>
            Marcar como renovado (mais 1 ano)
          </Botao>
          <p className="mt-1 text-xs text-tinta-suave">Use depois de renovar no Registro.br. O vencimento sobe 1 ano e os avisos de 60 e 30 dias voltam a valer.</p>
        </div>
      ) : null}

      {panel === "registered" ? (
        <form
          className="flex flex-col gap-3 rounded-xl bg-areia p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run("register", () => marcarDominioComoRegistrado({ orderId: id, registeredAt, expiresAt }), () => setPanel(null));
          }}
        >
          <p className="text-sm text-tinta">Ao confirmar, o CPF/CNPJ completo é trocado pela versão escondida e o casal é avisado.</p>
          <Entrada
            label="Data do registro"
            type="date"
            value={registeredAt}
            onChange={(e) => {
              setRegisteredAt(e.target.value);
              if (e.target.value) setExpiresAt(maisUmAno(e.target.value));
            }}
            required
          />
          <Entrada label="Vencimento (1 ano depois)" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} required />
          <div className="flex flex-wrap gap-2">
            <Botao type="submit" disabled={pending} loading={pending && running === "register"}>
              Confirmar registro
            </Botao>
            <Botao type="button" variant="quiet" onClick={() => setPanel(null)} disabled={pending}>
              Voltar
            </Botao>
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
              run("reject", () => recusarPedidoDeDominio({ orderId: id, reason }), () => setReason(""));
            }}
          >
            <AreaDeTexto label="Motivo da recusa" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} hint="O casal recebe este texto por e-mail." />
            <Botao type="submit" variant="outline" disabled={reason.trim().length < 5 || pending} loading={pending && running === "reject"} className={cn(ESTILO_DE_PERIGO, "self-start")}>
              Recusar com motivo
            </Botao>
          </form>
        </section>
      ) : null}

      <ModalDeConfirmacao
        isOpen={panel === "online"}
        onClose={() => setPanel(null)}
        onConfirm={() => run("online", () => marcarDominioComoNoAr(id), () => setPanel(null))}
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
          run("note", () => salvarNotaDoDominio({ orderId: id, note }));
        }}
      >
        <AreaDeTexto label="Anotação da equipe" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} hint="O casal não vê." />
        <Botao type="submit" variant="outline" size="sm" disabled={note === (order.adminNote ?? "") || pending} loading={pending && running === "note"} className="self-start">
          Salvar anotação
        </Botao>
      </form>
    </div>
  );
}

const ETIQUETA_DA_SITUACAO = {
  ready: { tone: "sucesso", label: "Verificado e apontado" },
  pending_dns: { tone: "aviso", label: "Falta o DNS" },
  pending_verification: { tone: "aviso", label: "Falta a verificação" },
} as const;

function PainelDaConexao({ connection }: { connection: ResultadoDaConexao }) {
  if (!connection.ok) {
    return (
      <p role="status" className="rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
        {connection.message}
      </p>
    );
  }
  const chip = ETIQUETA_DA_SITUACAO[connection.state];
  return (
    <div className="flex flex-col gap-3">
      <p className="flex flex-wrap items-center gap-2 text-sm text-tinta">
        <EtiquetaDeSituacao tone={chip.tone} icon={connection.state === "ready" ? CheckCircle2 : Clock}>
          {chip.label}
        </EtiquetaDeSituacao>
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
              <button type="button" onClick={() => copiarTexto(record.value, "Valor copiado.")} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm)}>
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
