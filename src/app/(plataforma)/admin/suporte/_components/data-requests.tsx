"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, Download, Plus, ShieldCheck, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { FormAlert } from "@/components/ui/field";
import { Panel } from "@/components/plataforma/panel";
import { StatusChip, type StatusTone } from "@/components/plataforma/status-chip";
import { EmptyState } from "@/components/plataforma/empty-state";
import { btn } from "@/components/landing/styles";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/plataforma/export-button";
import { TIPOS_DE_SOLICITACAO_DE_DADOS, ROTULO_DO_TIPO_DE_SOLICITACAO_DE_DADOS } from "@/lib/platform/support";
import { createDataRequest, fulfillDeletionRequest, updateDataRequest } from "@/actions/admin-suporte-actions";
import { useAdminAction } from "../../_sistema/use-admin-action";

export interface DataRequestItem {
  id: string;
  type: (typeof TIPOS_DE_SOLICITACAO_DE_DADOS)[number];
  requesterName: string;
  requesterEmail: string;
  linked: boolean;
  status: "NEW" | "IN_REVIEW" | "DONE" | "REFUSED";
  receivedLabel: string;
  dueLabel: string;
  /** Texto do prazo ("vence em 4 dias", "venceu há 2 dias") e o tom do chip; closed = sem chip. */
  dueText: string | null;
  dueTone: "perigo" | "neutro" | null;
  note: string | null;
}

const STATUS: Record<DataRequestItem["status"], { label: string; tone: StatusTone; icon: typeof Clock }> = {
  NEW: { label: "Novo", tone: "aviso", icon: Clock },
  IN_REVIEW: { label: "Em análise", tone: "aviso", icon: Clock },
  DONE: { label: "Pronto", tone: "salvia", icon: CheckCircle2 },
  REFUSED: { label: "Recusado", tone: "neutro", icon: XCircle },
};

export function DataRequests({ rows, urgent }: { rows: DataRequestItem[]; urgent: string | null }) {
  const [formOpen, setFormOpen] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Panel
      title="Pedidos sobre dados pessoais"
      aside={
        <div className="flex flex-wrap items-center gap-2">
          {urgent && (
            <StatusChip tone="perigo" icon={AlertTriangle}>
              {urgent}
            </StatusChip>
          )}
          {!formOpen && (
            <button type="button" onClick={() => setFormOpen(true)} className={`${btn.secondary} ${btn.sm}`}>
              <Plus className="size-4" aria-hidden="true" /> Registrar pedido
            </button>
          )}
        </div>
      }
    >
      {formOpen && <NewRequest onDone={() => setFormOpen(false)} />}
      {rows.length === 0 ? (
        <EmptyState icon={ShieldCheck} compact title="Nenhum pedido de titular registrado">
          Pedidos de exportação, exclusão ou correção de dados chegam por e-mail ou WhatsApp: registre aqui para acompanhar o prazo. O que a própria pessoa faz em Minha conta não aparece nesta lista.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha">
          {rows.map((r) => {
            const s = STATUS[r.status];
            return (
              <li key={r.id}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold leading-5 text-tinta">
                      {ROTULO_DO_TIPO_DE_SOLICITACAO_DE_DADOS[r.type]} · {r.requesterName}
                    </p>
                    <p className="text-sm leading-5 text-tinta-suave">
                      Pedido em {r.receivedLabel} · prazo {r.dueLabel}
                      {r.linked ? "" : " · sem conta ligada"}
                    </p>
                    {r.dueText && <p className={r.dueTone === "perigo" ? "text-sm font-semibold leading-5 text-perigo" : "text-sm leading-5 text-tinta-suave"}>{r.dueText}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip tone={s.tone} icon={s.icon}>
                      {s.label}
                    </StatusChip>
                    <button type="button" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)} className={`${btn.quiet} ${btn.sm}`}>
                      {open === r.id ? "Fechar" : "Atender"}
                    </button>
                  </div>
                </div>
                {open === r.id && <Handle item={r} onDone={() => setOpen(null)} />}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-sm text-tinta-suave">Exportação e exclusão têm prazo de 15 dias para responder. Confirme o prazo com o jurídico.</p>
    </Panel>
  );
}

function NewRequest({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [type, setType] = useState<DataRequestItem["type"]>("EXPORT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [receivedOn, setReceivedOn] = useState("");
  const [note, setNote] = useState("");
  const { pending, errors, formError, run } = useAdminAction();
  return (
    <form
      className="mb-4 flex flex-col gap-4 rounded-2xl bg-linho p-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => createDataRequest({ type, requesterName: name, requesterEmail: email, receivedOn, note }), () => {
          onDone();
          router.refresh();
        });
      }}
    >
      <h3 className="text-lg font-semibold text-tinta">Registrar um pedido de titular</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NativeSelect label="Tipo de pedido" alwaysFloat value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          {TIPOS_DE_SOLICITACAO_DE_DADOS.map((t) => (
            <option key={t} value={t}>
              {ROTULO_DO_TIPO_DE_SOLICITACAO_DE_DADOS[t]}
            </option>
          ))}
        </NativeSelect>
        <DatePicker label="Recebido em" optional value={receivedOn} onChange={(e) => setReceivedOn(e.target.value)} error={errors.receivedOn} hint="Vazio vale hoje." />
        <Input label="Quem pediu" value={name} onChange={(e) => setName(e.target.value)} error={errors.requesterName} maxLength={120} />
        <Input label="E-mail da pessoa" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.requesterEmail} hint="Se for o e-mail de uma conta, o pedido se liga a ela." />
      </div>
      <Textarea label="Observação" optional value={note} onChange={(e) => setNote(e.target.value)} error={errors.note} rows={2} maxLength={2000} />
      {formError && !Object.keys(errors).length && <FormAlert>{formError}</FormAlert>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          Registrar pedido
        </Button>
        <Button type="button" variant="quiet" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function Handle({ item, onDone }: { item: DataRequestItem; onDone: () => void }) {
  const router = useRouter();
  const [note, setNote] = useState(item.note ?? "");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { pending, errors, formError, run } = useAdminAction();
  const [running, setRunning] = useState<"review" | "done" | "refuse" | null>(null); // só o botão clicado mostra o spinner
  const closed = item.status === "DONE" || item.status === "REFUSED";
  const after = () => {
    onDone();
    router.refresh();
  };
  return (
    <div className="flex flex-col gap-4 border-t border-linha bg-linho px-4 py-4">
      <p className="text-sm text-tinta-suave">{item.requesterEmail}</p>
      {item.type === "EXPORT" && item.linked && (
        <div>
          <ExportButton href={`/api/admin/suporte/exportar?pedido=${item.id}`} fallbackName="exportacao.json" size="sm">
            <Download className="size-4" aria-hidden="true" /> Baixar a exportação (JSON)
          </ExportButton>
          <p className="mt-1 text-sm text-tinta-suave">Sem senhas nem tokens. Envie o arquivo ao titular pelo e-mail dele e marque como pronto. O download fica no registro.</p>
        </div>
      )}
      <Textarea label="Nota do atendimento" optional hint="Obrigatória para recusar. Fica no registro." value={note} onChange={(e) => setNote(e.target.value)} error={errors.note} rows={2} maxLength={2000} />
      {formError && !Object.keys(errors).length && <FormAlert>{formError}</FormAlert>}
      {!closed && (
        <div className="flex flex-wrap gap-3">
          {item.status === "NEW" && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              loading={pending && running === "review"}
              onClick={() => {
                setRunning("review");
                run(() => updateDataRequest({ id: item.id, status: "IN_REVIEW", note }), after);
              }}
            >
              Marcar em análise
            </Button>
          )}
          <Button
            type="button"
            disabled={pending}
            loading={pending && running === "done"}
            onClick={() => {
              setRunning("done");
              run(() => updateDataRequest({ id: item.id, status: "DONE", note }), after);
            }}
          >
            Marcar como pronto
          </Button>
          <Button
            type="button"
            variant="quiet"
            disabled={pending}
            loading={pending && running === "refuse"}
            onClick={() => {
              setRunning("refuse");
              run(() => updateDataRequest({ id: item.id, status: "REFUSED", note }));
            }}
            className="text-perigo"
          >
            Recusar
          </Button>
        </div>
      )}
      {item.type === "DELETE" && item.linked && !closed && (
        <div className="flex flex-col gap-3 rounded-2xl border border-perigo/40 bg-papel p-4">
          <p className="font-semibold text-tinta">Excluir a conta agora</p>
          <p className="text-sm leading-5 text-tinta-suave">Apaga a conta e, se for o último membro, o casamento (ou o perfil de fornecedor) com tudo dentro. Os pagamentos ficam guardados sem vínculo, para fins fiscais. Não dá para desfazer.</p>
          <Input label="Digite o e-mail do titular para confirmar" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} error={errors.confirmEmail} autoComplete="off" />
          <div>
            <Button type="button" variant="outline" disabled={pending || confirmEmail.trim().length < 5} onClick={() => setConfirmOpen(true)} className="text-perigo">
              Excluir a conta
            </Button>
          </div>
          <ConfirmModal
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title="Excluir esta conta?"
            description={`A conta de ${item.requesterName} será apagada de vez.`}
            confirmText="Excluir a conta"
            isLoading={pending}
            onConfirm={() =>
              run(
                () => fulfillDeletionRequest({ id: item.id, confirmEmail }),
                () => {
                  setConfirmOpen(false);
                  after();
                },
              )
            }
          />
        </div>
      )}
    </div>
  );
}
