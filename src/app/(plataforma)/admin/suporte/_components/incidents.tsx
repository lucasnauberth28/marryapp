"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldCheck } from "lucide-react";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { SeletorDeData } from "@/components/ui/date-picker";
import { AvisoDoFormulario } from "@/components/ui/field";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { estiloDoBotao } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { criarIncidenteDeSeguranca, atualizarIncidenteDeSeguranca } from "@/actions/admin-suporte-actions";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";

export interface ItemDeIncidente {
  id: string;
  title: string;
  description: string;
  affected: string | null;
  discoveredLabel: string;
  /** AAAA-MM-DD do aviso, para o campo de data. */
  notifiedOn: string;
  notifiedWho: string | null;
  open: boolean;
}

export function Incidentes({ rows, today }: { rows: ItemDeIncidente[]; today: string }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <Painel
      title="Incidentes de segurança"
      aside={
        !formOpen && (
          <button type="button" onClick={() => setFormOpen(true)} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
            <Plus className="size-4" aria-hidden="true" /> Registrar incidente
          </button>
        )
      }
    >
      {formOpen && <NovoIncidente today={today} onDone={() => setFormOpen(false)} />}
      {rows.length === 0 ? (
        <EstadoVazio icon={ShieldCheck} compact title="Nenhum incidente registrado">
          Se algo acontecer, registre aqui o que foi afetado, quando e quem foi avisado.
        </EstadoVazio>
      ) : (
        <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha">
          {rows.map((i) => (
            <li key={i.id}>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold leading-5 text-tinta">{i.title}</p>
                  <p className="text-sm text-tinta-suave">Descoberto em {i.discoveredLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <EtiquetaDeSituacao tone={i.open ? "aviso" : "neutro"}>{i.open ? "Aberto" : "Fechado"}</EtiquetaDeSituacao>
                  <button type="button" aria-expanded={editing === i.id} onClick={() => setEditing(editing === i.id ? null : i.id)} className={`${estiloDoBotao.quiet} ${estiloDoBotao.sm}`}>
                    {editing === i.id ? "Fechar" : "Ver"}
                  </button>
                </div>
              </div>
              {editing === i.id && <EditorDeIncidente item={i} onDone={() => setEditing(null)} />}
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}

function NovoIncidente({ today, onDone }: { today: string; onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [affected, setAffected] = useState("");
  const [discoveredAt, setDiscoveredAt] = useState(today);
  const [notifiedOn, setNotifiedOn] = useState("");
  const [notifiedWho, setNotifiedWho] = useState("");
  const { pending, errors, formError, run } = useAcaoDoAdmin();
  return (
    <form
      className="mb-4 flex flex-col gap-4 rounded-2xl bg-linho p-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => criarIncidenteDeSeguranca({ title, description, affected, discoveredAt, notifiedOn, notifiedWho }), () => {
          onDone();
          router.refresh();
        });
      }}
    >
      <Entrada label="Título" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} maxLength={140} />
      <AreaDeTexto label="O que aconteceu" value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} rows={3} maxLength={3000} />
      <AreaDeTexto label="O que foi afetado" optional value={affected} onChange={(e) => setAffected(e.target.value)} error={errors.affected} rows={2} maxLength={2000} />
      <SeletorDeData label="Descoberto em" value={discoveredAt} onChange={(e) => setDiscoveredAt(e.target.value)} error={errors.discoveredAt} />
      <SeletorDeData label="Quando avisou" optional value={notifiedOn} onChange={(e) => setNotifiedOn(e.target.value)} error={errors.notifiedOn} />
      <AreaDeTexto label="Quem foi avisado" optional value={notifiedWho} onChange={(e) => setNotifiedWho(e.target.value)} error={errors.notifiedWho} rows={2} maxLength={2000} />
      {formError && !Object.keys(errors).length && <AvisoDoFormulario>{formError}</AvisoDoFormulario>}
      <div className="flex flex-wrap gap-3">
        <Botao type="submit" loading={pending}>
          Registrar incidente
        </Botao>
        <Botao type="button" variant="quiet" onClick={onDone} disabled={pending}>
          Cancelar
        </Botao>
      </div>
    </form>
  );
}

type AcaoDoIncidente = "save" | "close" | "reopen";

function BotoesDoIncidente({ item, pending, running, aoAgir }: { item: ItemDeIncidente; pending: boolean; running: AcaoDoIncidente | null; aoAgir: (acao: AcaoDoIncidente) => void }) {
  return (
    <>
      <Botao type="button" variant="outline" disabled={pending} loading={pending && running === "save"} onClick={() => aoAgir("save")}>
        Salvar aviso
      </Botao>
      {item.open ? (
        <Botao type="button" disabled={pending} loading={pending && running === "close"} onClick={() => aoAgir("close")}>
          Fechar o incidente
        </Botao>
      ) : (
        <Botao type="button" variant="quiet" disabled={pending} loading={pending && running === "reopen"} onClick={() => aoAgir("reopen")}>
          Reabrir
        </Botao>
      )}
    </>
  );
}

function EditorDeIncidente({ item, onDone }: { item: ItemDeIncidente; onDone: () => void }) {
  const router = useRouter();
  const [notifiedOn, setNotifiedOn] = useState(item.notifiedOn);
  const [notifiedWho, setNotifiedWho] = useState(item.notifiedWho ?? "");
  const { pending, errors, formError, run } = useAcaoDoAdmin();
  const [running, setRunning] = useState<AcaoDoIncidente | null>(null); // só o botão clicado mostra o spinner
  const after = () => {
    onDone();
    router.refresh();
  };
  const agir = (acao: "save" | "close" | "reopen") => {
    setRunning(acao);
    run(() => atualizarIncidenteDeSeguranca({ id: item.id, notifiedOn, notifiedWho, ...(acao === "close" ? { close: true } : acao === "reopen" ? { reopen: true } : {}) }), after);
  };
  return (
    <div className="flex flex-col gap-4 border-t border-linha bg-linho px-4 py-4">
      <p className="whitespace-pre-line text-sm leading-5 text-tinta">{item.description}</p>
      {item.affected && <p className="whitespace-pre-line text-sm leading-5 text-tinta-suave">Afetado: {item.affected}</p>}
      <SeletorDeData label="Quando avisou" optional value={notifiedOn} onChange={(e) => setNotifiedOn(e.target.value)} error={errors.notifiedOn} />
      <AreaDeTexto label="Quem foi avisado" optional value={notifiedWho} onChange={(e) => setNotifiedWho(e.target.value)} rows={2} maxLength={2000} />
      {formError && !Object.keys(errors).length && <AvisoDoFormulario>{formError}</AvisoDoFormulario>}
      <div className="flex flex-wrap gap-3">
        <BotoesDoIncidente item={item} pending={pending} running={running} aoAgir={agir} />
      </div>
    </div>
  );
}
