"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Download, Pencil, Plus, Trash2 } from "lucide-react";
import { criarEventoDaLinhaDoTempo, excluirEventoDaLinhaDoTempo, atualizarEventoDaLinhaDoTempo } from "@/actions/timeline-actions";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { ModalPersonalizado } from "@/components/ui/custom-modal";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { btn, estiloDoBotaoDePerigo, estiloDoBotaoDeIcone, estiloDoBotaoDeIconeDePerigo, estiloDoCartao, estiloDaCaixaDeErro } from "@/components/painel/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { useEstadoSincronizado } from "@/hooks/use-synced-state";
import { gerarPdfDaLinhaDoTempo, type EventoDaLinhaDoTempoNoPdf } from "@/lib/generate-timeline-pdf";

type EventoDaLinhaDoTempo = EventoDaLinhaDoTempoNoPdf & { position?: number; icon?: string };

/** "14:00" vira "14h" e "19:30" vira "19h30". */
function rotuloDaHora(time: string) {
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return time;
  const h = Number(m[1]);
  return m[2] === "00" ? `${h}h` : `${h}h${m[2]}`;
}

function FormularioDoEvento({ event, count, onClose, onSaved, onDelete }: { event: EventoDaLinhaDoTempo | null; count: number; onClose: () => void; onSaved: () => void; onDelete: (e: EventoDaLinhaDoTempo) => void }) {
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
    const res = event ? await atualizarEventoDaLinhaDoTempo(event.id, payload) : await criarEventoDaLinhaDoTempo(payload);
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
      <Input
        id={ids.title}
        label="O que acontece"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ex.: Cerimônia, coquetel, valsa"
        disabled={busy}
        error={error && !title.trim() ? error : undefined}
      />
      <Input
        id={ids.time}
        type="time"
        label="Horário"
        fieldClassName="sm:max-w-44"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        disabled={busy}
        error={error && title.trim() && !time ? error : undefined}
      />
      <Textarea
        id={ids.description}
        label="Local ou detalhes"
        optional
        hint="Quem vê o site também lê este texto."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        disabled={busy}
      />
      {error && title.trim() && time && (
        <p role="alert" className={estiloDaCaixaDeErro}>
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2 border-t border-linha pt-4">
        <BotaoComCarregamento type="submit" loading={busy} className={`${btn.primary} ${btn.block}`}>
          {event ? "Salvar alterações" : "Adicionar horário"}
        </BotaoComCarregamento>
        <button type="button" onClick={onClose} disabled={busy} className={`${btn.quiet} ${btn.block}`}>
          Cancelar
        </button>
        {event && (
          <button type="button" onClick={() => onDelete(event)} disabled={busy} className={`${estiloDoBotaoDePerigo} w-full`}>
            Excluir horário
          </button>
        )}
      </div>
    </form>
  );
}

export function LinhaDoTempoCliente({ initialEvents, coupleNames, dateLabel }: { initialEvents: EventoDaLinhaDoTempo[]; coupleNames: string; dateLabel: string | null }) {
  const router = useRouter();
  const [events, setEvents] = useEstadoSincronizado<EventoDaLinhaDoTempo[]>(initialEvents);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventoDaLinhaDoTempo | null>(null);
  const [toDelete, setToDelete] = useState<EventoDaLinhaDoTempo | null>(null);

  const sorted = [...events].sort((a, b) => a.time.localeCompare(b.time));

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(e: EventoDaLinhaDoTempo) {
    setEditing(e);
    setModalOpen(true);
  }

  async function executeDelete(target: EventoDaLinhaDoTempo) {
    const toastId = toast.loading("Removendo o horário...");
    const res = await excluirEventoDaLinhaDoTempo(target.id);
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
    if (gerarPdfDaLinhaDoTempo(events, coupleNames)) toast.success("PDF do cronograma gerado.");
  }

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDaPagina
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
        <div className={`${estiloDoCartao} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
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
            <li key={e.id} className={`${estiloDoCartao} grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5 sm:py-4`}>
              <span className="font-num text-[22px] leading-8 text-ameixa [font-variant-numeric:lining-nums] sm:text-[26px]">{rotuloDaHora(e.time)}</span>
              <div className="min-w-0">
                <strong className="block font-semibold text-tinta">{e.title}</strong>
                {e.description && <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-tinta-suave">{e.description}</p>}
              </div>
              <div className="flex items-center">
                <button type="button" onClick={() => openEdit(e)} aria-label={`Editar ${e.title}`} className={estiloDoBotaoDeIcone}>
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setToDelete(e)} aria-label={`Excluir ${e.title}`} className={estiloDoBotaoDeIconeDePerigo}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <ModalPersonalizado isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar horário" : "Novo horário"} size="sm" className="max-h-[92vh] overflow-y-auto">
        <FormularioDoEvento
          event={editing}
          count={events.length}
          onClose={() => setModalOpen(false)}
          onSaved={() => router.refresh()}
          onDelete={(e) => {
            setModalOpen(false);
            setToDelete(e);
          }}
        />
      </ModalPersonalizado>

      <ModalDeConfirmacao
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
