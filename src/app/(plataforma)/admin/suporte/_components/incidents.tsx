"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { FormAlert } from "@/components/ui/field";
import { Panel } from "@/components/plataforma/panel";
import { StatusChip } from "@/components/plataforma/status-chip";
import { EmptyState } from "@/components/plataforma/empty-state";
import { btn } from "@/components/landing/styles";
import { Button } from "@/components/ui/button";
import { createSecurityIncident, updateSecurityIncident } from "@/actions/admin-suporte-actions";
import { useAdminAction } from "../../_sistema/use-admin-action";

export interface IncidentItem {
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

export function Incidents({ rows, today }: { rows: IncidentItem[]; today: string }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <Panel
      title="Incidentes de segurança"
      aside={
        !formOpen && (
          <button type="button" onClick={() => setFormOpen(true)} className={`${btn.secondary} ${btn.sm}`}>
            <Plus className="size-4" aria-hidden="true" /> Registrar incidente
          </button>
        )
      }
    >
      {formOpen && <NewIncident today={today} onDone={() => setFormOpen(false)} />}
      {rows.length === 0 ? (
        <EmptyState icon={ShieldCheck} compact title="Nenhum incidente registrado">
          Se algo acontecer, registre aqui o que foi afetado, quando e quem foi avisado.
        </EmptyState>
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
                  <StatusChip tone={i.open ? "aviso" : "neutro"}>{i.open ? "Aberto" : "Fechado"}</StatusChip>
                  <button type="button" aria-expanded={editing === i.id} onClick={() => setEditing(editing === i.id ? null : i.id)} className={`${btn.quiet} ${btn.sm}`}>
                    {editing === i.id ? "Fechar" : "Ver"}
                  </button>
                </div>
              </div>
              {editing === i.id && <IncidentEditor item={i} onDone={() => setEditing(null)} />}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function NewIncident({ today, onDone }: { today: string; onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [affected, setAffected] = useState("");
  const [discoveredAt, setDiscoveredAt] = useState(today);
  const [notifiedOn, setNotifiedOn] = useState("");
  const [notifiedWho, setNotifiedWho] = useState("");
  const { pending, errors, formError, run } = useAdminAction();
  return (
    <form
      className="mb-4 flex flex-col gap-4 rounded-2xl bg-linho p-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => createSecurityIncident({ title, description, affected, discoveredAt, notifiedOn, notifiedWho }), () => {
          onDone();
          router.refresh();
        });
      }}
    >
      <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} maxLength={140} />
      <Textarea label="O que aconteceu" value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} rows={3} maxLength={3000} />
      <Textarea label="O que foi afetado" optional value={affected} onChange={(e) => setAffected(e.target.value)} error={errors.affected} rows={2} maxLength={2000} />
      <DatePicker label="Descoberto em" value={discoveredAt} onChange={(e) => setDiscoveredAt(e.target.value)} error={errors.discoveredAt} />
      <DatePicker label="Quando avisou" optional value={notifiedOn} onChange={(e) => setNotifiedOn(e.target.value)} error={errors.notifiedOn} />
      <Textarea label="Quem foi avisado" optional value={notifiedWho} onChange={(e) => setNotifiedWho(e.target.value)} error={errors.notifiedWho} rows={2} maxLength={2000} />
      {formError && !Object.keys(errors).length && <FormAlert>{formError}</FormAlert>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          Registrar incidente
        </Button>
        <Button type="button" variant="quiet" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function IncidentEditor({ item, onDone }: { item: IncidentItem; onDone: () => void }) {
  const router = useRouter();
  const [notifiedOn, setNotifiedOn] = useState(item.notifiedOn);
  const [notifiedWho, setNotifiedWho] = useState(item.notifiedWho ?? "");
  const { pending, errors, formError, run } = useAdminAction();
  const [running, setRunning] = useState<"save" | "close" | "reopen" | null>(null); // só o botão clicado mostra o spinner
  const after = () => {
    onDone();
    router.refresh();
  };
  return (
    <div className="flex flex-col gap-4 border-t border-linha bg-linho px-4 py-4">
      <p className="whitespace-pre-line text-sm leading-5 text-tinta">{item.description}</p>
      {item.affected && <p className="whitespace-pre-line text-sm leading-5 text-tinta-suave">Afetado: {item.affected}</p>}
      <DatePicker label="Quando avisou" optional value={notifiedOn} onChange={(e) => setNotifiedOn(e.target.value)} error={errors.notifiedOn} />
      <Textarea label="Quem foi avisado" optional value={notifiedWho} onChange={(e) => setNotifiedWho(e.target.value)} rows={2} maxLength={2000} />
      {formError && !Object.keys(errors).length && <FormAlert>{formError}</FormAlert>}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          loading={pending && running === "save"}
          onClick={() => {
            setRunning("save");
            run(() => updateSecurityIncident({ id: item.id, notifiedOn, notifiedWho }), after);
          }}
        >
          Salvar aviso
        </Button>
        {item.open ? (
          <Button
            type="button"
            disabled={pending}
            loading={pending && running === "close"}
            onClick={() => {
              setRunning("close");
              run(() => updateSecurityIncident({ id: item.id, notifiedOn, notifiedWho, close: true }), after);
            }}
          >
            Fechar o incidente
          </Button>
        ) : (
          <Button
            type="button"
            variant="quiet"
            disabled={pending}
            loading={pending && running === "reopen"}
            onClick={() => {
              setRunning("reopen");
              run(() => updateSecurityIncident({ id: item.id, notifiedOn, notifiedWho, reopen: true }), after);
            }}
          >
            Reabrir
          </Button>
        )}
      </div>
    </div>
  );
}
