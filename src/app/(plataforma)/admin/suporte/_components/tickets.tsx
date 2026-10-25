"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Plus, Clock, CheckCircle2, MessageCircle, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { AvisoDoFormulario } from "@/components/ui/field";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao, type TomDaSituacao } from "@/components/plataforma/status-chip";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { estiloDoBotao } from "@/components/landing/styles";
import { Button } from "@/components/ui/button";
import { SITUACOES_DO_CHAMADO, ROTULO_DA_SITUACAO_DO_CHAMADO } from "@/lib/platform/support";
import { criarChamadoDeSuporte, atualizarChamadoDeSuporte } from "@/actions/admin-suporte-actions";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";

export interface ItemDeChamado {
  id: string;
  number: number;
  subject: string;
  body: string | null;
  requesterName: string;
  requesterEmail: string | null;
  status: (typeof SITUACOES_DO_CHAMADO)[number];
  assigneeName: string | null;
  mine: boolean;
  internalNote: string | null;
  whenLabel: string;
  weddingId: string | null;
  vendorId: string | null;
}

export interface PreenchimentoDoChamado {
  weddingId?: string;
  vendorId?: string;
  requesterName: string;
  requesterEmail: string;
  label: string;
}

const TONS_DA_ETIQUETA: Record<ItemDeChamado["status"], { tone: TomDaSituacao; icon: typeof Clock }> = {
  NEW: { tone: "aviso", icon: Clock },
  IN_PROGRESS: { tone: "aviso", icon: Clock },
  ANSWERED: { tone: "salvia", icon: CheckCircle2 },
  CLOSED: { tone: "neutro", icon: Lock },
};

export function Chamados({ rows, newCount, closedCount, showClosed, prefill, openForm }: { rows: ItemDeChamado[]; newCount: number; closedCount: number; showClosed: boolean; prefill: PreenchimentoDoChamado | null; openForm: boolean }) {
  const [formOpen, setFormOpen] = useState(openForm);
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <Painel
      title="Pedidos de ajuda"
      aside={
        <div className="flex flex-wrap items-center gap-2">
          {newCount > 0 && (
            <EtiquetaDeSituacao tone="aviso" icon={Bell}>
              {newCount} {newCount === 1 ? "novo" : "novos"}
            </EtiquetaDeSituacao>
          )}
          {!formOpen && (
            <button type="button" onClick={() => setFormOpen(true)} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
              <Plus className="size-4" aria-hidden="true" /> Registrar pedido
            </button>
          )}
        </div>
      }
    >
      <div id="chamados" className="scroll-mt-24" />
      {formOpen && <NovoChamado prefill={prefill} onDone={() => setFormOpen(false)} />}
      {rows.length === 0 ? (
        <EstadoVazio icon={MessageCircle} compact title={showClosed ? "Nenhum pedido registrado" : "Nenhum pedido em aberto"}>
          Não há formulário público: registre aqui os pedidos que chegarem por WhatsApp ou e-mail.
        </EstadoVazio>
      ) : (
        <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha">
          {rows.map((t) => {
            const s = TONS_DA_ETIQUETA[t.status];
            return (
              <li key={t.id}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold leading-5 text-tinta">
                      <span className="text-tinta-suave">#{t.number}</span> {t.subject}
                    </p>
                    <p className="text-sm leading-5 text-tinta-suave">
                      {t.requesterName} · {t.whenLabel} · {t.assigneeName ? `Responsável: ${t.mine ? "você" : t.assigneeName.split(" ")[0]}` : "Sem responsável"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <EtiquetaDeSituacao tone={s.tone} icon={s.icon}>
                      {ROTULO_DA_SITUACAO_DO_CHAMADO[t.status]}
                    </EtiquetaDeSituacao>
                    <button type="button" aria-expanded={editing === t.id} onClick={() => setEditing(editing === t.id ? null : t.id)} className={`${estiloDoBotao.quiet} ${estiloDoBotao.sm}`}>
                      {editing === t.id ? "Fechar" : "Abrir"}
                    </button>
                  </div>
                </div>
                {editing === t.id && <EditorDeChamado ticket={t} onDone={() => setEditing(null)} />}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-sm text-tinta-suave">
        {showClosed ? (
          <Link href="/admin/suporte#chamados" className="font-semibold text-ameixa underline underline-offset-2">
            Esconder os encerrados
          </Link>
        ) : closedCount > 0 ? (
          <Link href="/admin/suporte?encerrados=1#chamados" className="font-semibold text-ameixa underline underline-offset-2">
            Mostrar os {closedCount} encerrados
          </Link>
        ) : null}
      </p>
    </Painel>
  );
}

function NovoChamado({ prefill, onDone }: { prefill: PreenchimentoDoChamado | null; onDone: () => void }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState(prefill?.requesterName ?? "");
  const [email, setEmail] = useState(prefill?.requesterEmail ?? "");
  const [phone, setPhone] = useState("");
  const { pending, errors, formError, run } = useAcaoDoAdmin();
  return (
    <form
      className="mb-4 flex flex-col gap-4 rounded-2xl bg-linho p-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => criarChamadoDeSuporte({ subject, body, requesterName: name, requesterEmail: email, requesterPhone: phone, weddingId: prefill?.weddingId, vendorId: prefill?.vendorId }),
          () => {
            onDone();
            router.replace("/admin/suporte#chamados");
            router.refresh();
          },
        );
      }}
    >
      <h3 className="text-lg font-semibold text-tinta">Registrar um pedido de ajuda</h3>
      {prefill && <p className="text-sm text-tinta-suave">Ligado ao {prefill.label}.</p>}
      <Input label="Assunto" value={subject} onChange={(e) => setSubject(e.target.value)} error={errors.subject} maxLength={140} />
      <Textarea label="O que a pessoa contou" optional value={body} onChange={(e) => setBody(e.target.value)} error={errors.body} rows={3} maxLength={2000} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="Quem pediu" value={name} onChange={(e) => setName(e.target.value)} error={errors.requesterName} maxLength={120} />
        <Input label="E-mail" optional type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.requesterEmail} />
        <Input label="Telefone" optional value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.requesterPhone} maxLength={30} />
      </div>
      {formError && !Object.keys(errors).length && <AvisoDoFormulario>{formError}</AvisoDoFormulario>}
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

function EditorDeChamado({ ticket, onDone }: { ticket: ItemDeChamado; onDone: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState(ticket.status);
  const [note, setNote] = useState(ticket.internalNote ?? "");
  const [assign, setAssign] = useState<"keep" | "me" | "none">("keep");
  const { pending, errors, formError, run } = useAcaoDoAdmin();
  return (
    <form
      className="flex flex-col gap-4 border-t border-linha bg-linho px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => atualizarChamadoDeSuporte({ id: ticket.id, status, internalNote: note, assignToMe: assign === "me", unassign: assign === "none" }),
          () => {
            onDone();
            router.refresh();
          },
        );
      }}
    >
      {ticket.body && <p className="whitespace-pre-line rounded-xl bg-papel p-3 text-sm leading-5 text-tinta">{ticket.body}</p>}
      {(ticket.requesterEmail || ticket.weddingId || ticket.vendorId) && (
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-tinta-suave">
          {ticket.requesterEmail && <span>{ticket.requesterEmail}</span>}
          {ticket.weddingId && (
            <Link className="font-semibold text-ameixa underline underline-offset-2" href={`/admin/casais/${ticket.weddingId}`}>
              Abrir o casal
            </Link>
          )}
          {ticket.vendorId && (
            <Link className="font-semibold text-ameixa underline underline-offset-2" href={`/admin/fornecedores?id=${ticket.vendorId}`}>
              Abrir o fornecedor
            </Link>
          )}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NativeSelect label="Situação" value={status} onChange={(e) => setStatus(e.target.value as ItemDeChamado["status"])} alwaysFloat>
          {SITUACOES_DO_CHAMADO.map((s) => (
            <option key={s} value={s}>
              {ROTULO_DA_SITUACAO_DO_CHAMADO[s]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect label="Responsável" value={assign} onChange={(e) => setAssign(e.target.value as typeof assign)} alwaysFloat>
          <option value="keep">{ticket.assigneeName ? `Continua ${ticket.mine ? "com você" : ticket.assigneeName.split(" ")[0]}` : "Sem responsável"}</option>
          <option value="me">Assumir (eu)</option>
          {ticket.assigneeName && <option value="none">Tirar o responsável</option>}
        </NativeSelect>
      </div>
      <Textarea label="Nota interna" optional hint="Só a equipe vê." value={note} onChange={(e) => setNote(e.target.value)} error={errors.internalNote} rows={3} maxLength={2000} />
      {formError && <AvisoDoFormulario>{formError}</AvisoDoFormulario>}
      <div>
        <Button type="submit" loading={pending}>
          Salvar
        </Button>
      </div>
    </form>
  );
}
