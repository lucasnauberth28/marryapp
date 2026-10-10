"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Download, Pencil, Plus, Trash2 } from "lucide-react";
import { createTimelineEvent, deleteTimelineEvent, updateTimelineEvent } from "@/actions/timeline-actions";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { CustomModal } from "@/components/ui/custom-modal";
import { PageHeader } from "@/components/admin/page-header";
import { btn, btnDanger, btnIcon, btnIconDanger, card, errorBox, hint, input, label, textarea } from "@/components/painel/styles";
import { useSyncedState } from "@/hooks/use-synced-state";
import { generateTimelinePdf, type TimelineEventPdf } from "@/lib/generate-timeline-pdf";

type TimelineEvent = TimelineEventPdf & { position?: number; icon?: string };

/** "14:00" vira "14h" e "19:30" vira "19h30". */
function timeLabel(time: string) {
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return time;
  const h = Number(m[1]);
  return m[2] === "00" ? `${h}h` : `${h}h${m[2]}`;
}

function EventForm({ event, count, onClose, onSaved, onDelete }: { event: TimelineEvent | null; count: number; onClose: () => void; onSaved: () => void; onDelete: (e: TimelineEvent) => void }) {
  const ids = { title: useId(), time: useId(), description: useId() };
  const [title, setTitle] = useState(event?.title ?? "");
  const [time, setTime] = useState(event?.time ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !time) {
      setError(!title.trim() ? "Dê um nome ao horário, por exemplo: Cerimônia." : "Escolha a hora.");
      return;
    }
    setError(null);
    setBusy(true);
    const toastId = toast.loading(event ? "Salvando o horário..." : "Adicionando o horário...");
    const payload = { title: title.trim(), time, description: description.trim(), icon: event?.icon ?? "Clock", position: event?.position ?? count };
    const res = event ? await updateTimelineEvent(event.id, payload) : await createTimelineEvent(payload);
    setBusy(false);
    if (res.success) {
      toast.success(event ? "Horário salvo." : "Horário adicionado.", { id: toastId });
      onSaved();
      onClose();
    } else {
      toast.error(res.error || "Não deu para salvar. Tente de novo.", { id: toastId });
      setError(res.error || "Não deu para salvar. Tente de novo.");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor={ids.title} className={label}>
          O que acontece
        </label>
        <input id={ids.title} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Cerimônia, coquetel, valsa" disabled={busy} className={input} />
      </div>
      <div className="flex flex-col gap-2 sm:max-w-44">
        <label htmlFor={ids.time} className={label}>
          Horário
        </label>
        <input id={ids.time} type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={busy} className={input} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={ids.description} className={label}>
          Local ou detalhes (opcional)
        </label>
        <textarea id={ids.description} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={busy} className={`${textarea} resize-y`} />
        <p className={hint}>Quem vê o site também lê este texto.</p>
      </div>
      {error && (
        <p role="alert" className={errorBox}>
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2 border-t border-linha pt-4">
        <button type="submit" disabled={busy} className={`${btn.primary} ${btn.block}`}>
          {busy ? "Salvando..." : event ? "Salvar alterações" : "Adicionar horário"}
        </button>
        <button type="button" onClick={onClose} disabled={busy} className={`${btn.quiet} ${btn.block}`}>
          Cancelar
        </button>
        {event && (
          <button type="button" onClick={() => onDelete(event)} disabled={busy} className={`${btnDanger} w-full`}>
            Excluir horário
          </button>
        )}
      </div>
    </form>
  );
}

export function TimelineClient({ initialEvents, coupleNames, dateLabel }: { initialEvents: TimelineEvent[]; coupleNames: string; dateLabel: string | null }) {
  const router = useRouter();
  const [events, setEvents] = useSyncedState<TimelineEvent[]>(initialEvents);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);
  const [toDelete, setToDelete] = useState<TimelineEvent | null>(null);

  const sorted = [...events].sort((a, b) => a.time.localeCompare(b.time));

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(e: TimelineEvent) {
    setEditing(e);
    setModalOpen(true);
  }

  async function executeDelete(target: TimelineEvent) {
    const toastId = toast.loading("Removendo o horário...");
    const res = await deleteTimelineEvent(target.id);
    if (res.success) {
      setEvents((prev) => prev.filter((e) => e.id !== target.id));
      toast.success("Horário removido.", { id: toastId });
      router.refresh();
    } else {
      toast.error(res.error || "Não deu para remover agora. Tente de novo.", { id: toastId });
    }
  }

  function exportPdf() {
    if (events.length === 0) {
      toast.error("Cadastre ao menos um horário para gerar o PDF.");
      return;
    }
    if (generateTimelinePdf(events, coupleNames)) toast.success("PDF do cronograma gerado.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={dateLabel ?? "Dia do casamento"}
        title="Cronograma do dia"
        description="Os convidados veem estes horários na página do dia do evento, no site de vocês."
        actions={
          <>
            <button type="button" onClick={exportPdf} disabled={events.length === 0} className={btn.secondary}>
              <Download className="size-4" aria-hidden="true" />
              PDF para fornecedores
            </button>
            <button type="button" onClick={openNew} className={btn.primary}>
              <Plus className="size-4" aria-hidden="true" />
              Novo horário
            </button>
          </>
        }
      />

      {sorted.length === 0 ? (
        <div className={`${card} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
          <span className="grid size-12 place-items-center rounded-full bg-ameixa-suave text-ameixa">
            <CalendarClock className="size-6" aria-hidden="true" />
          </span>
          <h2 className="font-display text-[26px] font-medium leading-8 text-tinta">Nenhum horário ainda</h2>
          <p className="max-w-md text-tinta-suave">Anotem a ordem do dia, da chegada dos fornecedores à pista de dança. Com tudo aqui, fornecedores e convidados sabem a hora de cada momento.</p>
          <button type="button" onClick={openNew} className={`${btn.primary} mt-2`}>
            Adicionar o primeiro horário
          </button>
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {sorted.map((e) => (
            <li key={e.id} className={`${card} grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5 sm:py-4`}>
              <span className="font-display text-[22px] leading-8 text-ameixa [font-variant-numeric:lining-nums] sm:text-[26px]">{timeLabel(e.time)}</span>
              <div className="min-w-0">
                <strong className="block font-semibold text-tinta">{e.title}</strong>
                {e.description && <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-tinta-suave">{e.description}</p>}
              </div>
              <div className="flex items-center">
                <button type="button" onClick={() => openEdit(e)} aria-label={`Editar ${e.title}`} className={btnIcon}>
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setToDelete(e)} aria-label={`Excluir ${e.title}`} className={btnIconDanger}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <CustomModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar horário" : "Novo horário"} size="sm" className="max-h-[92vh] overflow-y-auto">
        <EventForm
          event={editing}
          count={events.length}
          onClose={() => setModalOpen(false)}
          onSaved={() => router.refresh()}
          onDelete={(e) => {
            setModalOpen(false);
            setToDelete(e);
          }}
        />
      </CustomModal>

      <ConfirmModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          const t = toDelete;
          setToDelete(null);
          if (t) void executeDelete(t);
        }}
        title="Excluir horário"
        description={toDelete ? `Remover "${toDelete.title}" do cronograma? Não dá para desfazer.` : ""}
        confirmText="Excluir"
      />
    </div>
  );
}
