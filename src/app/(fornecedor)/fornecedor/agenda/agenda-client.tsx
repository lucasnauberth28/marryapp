"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarPlus, CalendarX2, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createVendorEvent, deleteVendorEvent } from "@/actions/vendor-panel-actions";
import { cn } from "@/lib/utils";
import { formatTime, MONTH_NAMES, WEEKDAYS_SHORT, type VendorEventKind } from "../../_lib/vendor-panel";

const BTN =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";
const BTN_PRIMARY = `${BTN} bg-ameixa text-on-ameixa hover:bg-ameixa-hover`;
const BTN_SECONDARY = `${BTN} border border-linha-forte bg-papel text-tinta hover:bg-areia`;
const BTN_QUIET = `${BTN} text-tinta-suave hover:bg-areia hover:text-tinta`;
const INPUT =
  "min-h-11 w-full rounded-xl border border-linha-forte bg-papel px-4 text-base text-tinta placeholder:text-tinta-suave/80 disabled:opacity-60";
const LABEL = "text-sm font-semibold text-tinta";

const WEEKDAYS_LONG = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export type DayItem =
  | { type: "WEDDING"; id: string; title: string; location: string | null }
  | { type: "MEETING" | "BLOCKED"; id: string; title: string; time: string | null; notes: string | null; leadId: string | null };

export interface LeadOption {
  id: string;
  label: string;
}

/** "2026-10-09" -> "sexta, 9 de outubro". */
function longDate(iso: string) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  return `${WEEKDAYS_LONG[d.getUTCDay()]}, ${d.getUTCDate()} de ${MONTH_NAMES[d.getUTCMonth()]}`;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ==========================================
// Diálogo nativo (<dialog>): foco preso, Esc fecha, camada superior.
// ==========================================

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-[480px] overflow-y-auto rounded-2xl border border-linha bg-papel p-0 text-tinta shadow-[var(--shadow-aceito-2)] backdrop:bg-tinta/40"
    >
      {open ? (
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="font-display text-2xl leading-8 font-medium">
              {title}
            </h2>
            <button type="button" onClick={onClose} aria-label="Fechar" className={cn(BTN_QUIET, "-mt-1 -mr-2 px-2.5")}>
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

// ==========================================
// Contexto: os botões do topo e o calendário abrem o mesmo formulário.
// ==========================================

type FormRequest = { kind: VendorEventKind; date: string };

const AgendaContext = createContext<{ openForm: (kind: VendorEventKind, date?: string) => void } | null>(null);

function useAgenda() {
  const ctx = useContext(AgendaContext);
  if (!ctx) throw new Error("useAgenda precisa do AgendaProvider.");
  return ctx;
}

export function AgendaProvider({
  todayIso,
  leads,
  children,
}: {
  todayIso: string;
  leads: LeadOption[];
  children: React.ReactNode;
}) {
  const [request, setRequest] = useState<FormRequest | null>(null);

  return (
    <AgendaContext.Provider value={{ openForm: (kind, date) => setRequest({ kind, date: date ?? todayIso }) }}>
      {children}
      <Modal
        open={request !== null}
        onClose={() => setRequest(null)}
        title={request?.kind === "BLOCKED" ? "Bloquear data" : "Nova reunião"}
      >
        {request ? (
          <EventForm key={`${request.kind}-${request.date}`} request={request} leads={leads} onDone={() => setRequest(null)} />
        ) : null}
      </Modal>
    </AgendaContext.Provider>
  );
}

export function NewEventButton({ kind }: { kind: VendorEventKind }) {
  const { openForm } = useAgenda();
  const Icon = kind === "BLOCKED" ? CalendarX2 : CalendarPlus;
  return (
    <button type="button" onClick={() => openForm(kind)} className={kind === "BLOCKED" ? BTN_SECONDARY : BTN_PRIMARY}>
      <Icon aria-hidden="true" className="size-[18px]" />
      {kind === "BLOCKED" ? "Bloquear data" : "Nova reunião"}
    </button>
  );
}

function EventForm({ request, leads, onDone }: { request: FormRequest; leads: LeadOption[]; onDone: () => void }) {
  const isMeeting = request.kind === "MEETING";
  const [values, setValues] = useState({ date: request.date, time: "", title: "", leadId: "", notes: "" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const uid = useId();

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const linkedLead = leads.find((l) => l.id === values.leadId);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createVendorEvent({ kind: request.kind, ...values });
      if (res.success) {
        toast.success(isMeeting ? "Reunião marcada na agenda." : "Data bloqueada na agenda.");
        onDone();
      } else {
        setError(res.error ?? "Não foi possível salvar.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {error ? (
        <p role="alert" className="rounded-xl bg-perigo-suave px-4 py-3 text-sm font-medium text-perigo">
          {error}
        </p>
      ) : null}
      <div className={cn("grid gap-4", isMeeting && "grid-cols-1 min-[420px]:grid-cols-2")}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${uid}-data`} className={LABEL}>
            Data
          </label>
          <input id={`${uid}-data`} type="date" required value={values.date} onChange={set("date")} className={INPUT} />
        </div>
        {isMeeting ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${uid}-hora`} className={LABEL}>
              Horário
            </label>
            <input id={`${uid}-hora`} type="time" required value={values.time} onChange={set("time")} className={INPUT} />
          </div>
        ) : null}
      </div>

      {isMeeting ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${uid}-pedido`} className={LABEL}>
            Pedido <span className="font-normal text-tinta-suave">(opcional)</span>
          </label>
          <select id={`${uid}-pedido`} value={values.leadId} onChange={set("leadId")} className={cn(INPUT, "cursor-pointer px-3")}>
            <option value="">Sem pedido vinculado</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-titulo`} className={LABEL}>
          {isMeeting ? "Título" : "Motivo"}{" "}
          {!isMeeting || linkedLead ? <span className="font-normal text-tinta-suave">(opcional)</span> : null}
        </label>
        <input
          id={`${uid}-titulo`}
          maxLength={120}
          value={values.title}
          onChange={set("title")}
          placeholder={
            isMeeting
              ? linkedLead
                ? `Reunião com ${linkedLead.label.split(" · ")[0]}`
                : "Ex.: Reunião online com Ana & Rafael"
              : "Ex.: viagem, outro evento"
          }
          className={INPUT}
        />
      </div>

      {isMeeting ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${uid}-notas`} className={LABEL}>
            Observações <span className="font-normal text-tinta-suave">(opcional)</span>
          </label>
          <textarea
            id={`${uid}-notas`}
            rows={3}
            maxLength={1000}
            value={values.notes}
            onChange={set("notes")}
            placeholder="Link da chamada, endereço, o que levar…"
            className={cn(INPUT, "min-h-24 resize-y py-3")}
          />
        </div>
      ) : (
        <p className="text-sm text-tinta-suave">Datas bloqueadas aparecem como ocupadas nos seus pedidos de orçamento.</p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onDone} disabled={isPending} className={BTN_SECONDARY}>
          Cancelar
        </button>
        <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
          {isPending ? <Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> : null}
          {isMeeting ? "Marcar reunião" : "Bloquear data"}
        </button>
      </div>
    </form>
  );
}

// ==========================================
// Excluir compromisso (confirmação em dois toques)
// ==========================================

export function DeleteEventButton({ eventId, label, onDeleted }: { eventId: string; label: string; onDeleted?: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const res = await deleteVendorEvent(eventId);
      if (res.success) {
        toast.success("Compromisso removido da agenda.");
        onDeleted?.();
      } else {
        toast.error(res.error ?? "Não foi possível excluir.");
        setConfirming(false);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onBlur={() => !isPending && setConfirming(false)}
      disabled={isPending}
      className={cn(BTN, "min-h-11 px-3 text-sm", confirming ? "bg-perigo-suave text-perigo" : "text-tinta-suave hover:bg-areia hover:text-tinta")}
    >
      {isPending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Trash2 aria-hidden="true" className="size-4" />}
      {confirming ? "Confirmar exclusão" : label}
    </button>
  );
}

// ==========================================
// Calendário do mês
// ==========================================

/** Pontos do calendário no celular: tons mais fortes que os das etiquetas para aparecerem no fundo claro. */
const DOT: Record<DayItem["type"], string> = {
  WEDDING: "bg-ameixa",
  MEETING: "bg-salvia",
  BLOCKED: "bg-linha-forte",
};

const PILL: Record<DayItem["type"], string> = {
  WEDDING: "bg-ameixa text-on-ameixa",
  MEETING: "bg-salvia-suave text-salvia",
  BLOCKED: "bg-areia text-tinta-suave",
};

function pillText(item: DayItem) {
  if (item.type === "WEDDING") return item.title;
  if (item.type === "BLOCKED") return "Bloqueado";
  const time = formatTime(item.time);
  return time ? `${item.title} · ${time}` : item.title;
}

function spokenItem(item: DayItem) {
  if (item.type === "WEDDING") return `Casamento de ${item.title}`;
  if (item.type === "BLOCKED") return `Data bloqueada${item.title !== "Data bloqueada" ? `: ${item.title}` : ""}`;
  const time = formatTime(item.time);
  return `Reunião: ${item.title}${time ? ` às ${time}` : ""}`;
}

export function AgendaCalendar({
  year,
  month,
  todayIso,
  days,
}: {
  year: number;
  /** 0 a 11 */
  month: number;
  todayIso: string;
  days: Record<string, DayItem[]>;
}) {
  const { openForm } = useAgenda();
  const [selected, setSelected] = useState<string | null>(null);

  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const isoOf = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const selectedItems = selected ? (days[selected] ?? []) : [];
  const selectedBlocked = selectedItems.some((i) => i.type === "BLOCKED");

  function openFromDay(kind: VendorEventKind) {
    const date = selected ?? todayIso;
    setSelected(null);
    openForm(kind, date);
  }

  return (
    <>
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="grid grid-cols-7 gap-1 sm:min-w-[560px] sm:gap-1.5">
          {WEEKDAYS_SHORT.map((d) => (
            <span key={d} aria-hidden="true" className="text-center text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase">
              {d}
            </span>
          ))}
          {Array.from({ length: firstWeekday }, (_, i) => (
            <div key={`vazio-${i}`} aria-hidden="true" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const iso = isoOf(day);
            const items = days[iso] ?? [];
            const isToday = iso === todayIso;
            const isPast = iso < todayIso;
            const spoken = [
              `${longDate(iso)}${isToday ? ", hoje" : ""}`,
              items.length > 0 ? items.map(spokenItem).join("; ") : "sem compromissos",
            ].join(". ");
            return (
              <button
                key={iso}
                type="button"
                aria-label={spoken}
                aria-current={isToday ? "date" : undefined}
                onClick={() => setSelected(iso)}
                className="flex min-h-14 min-w-0 flex-col items-center gap-1 rounded-[10px] border border-linha bg-papel p-1 text-left transition-colors hover:border-linha-forte hover:bg-linho sm:min-h-[104px] sm:items-stretch sm:gap-1.5 sm:p-2"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "text-sm font-semibold",
                    isToday ? "grid size-7 place-items-center rounded-full bg-tinta text-linho" : "h-7 leading-7",
                    isPast && !isToday && "text-tinta-suave",
                  )}
                >
                  {day}
                </span>
                {/* No celular, cada compromisso vira um ponto; o detalhe abre ao tocar no dia. */}
                {items.length > 0 ? (
                  <span aria-hidden="true" className="flex gap-1 sm:hidden">
                    {items.slice(0, 3).map((item) => (
                      <span key={`d-${item.type}-${item.id}`} className={cn("size-2 rounded-full", DOT[item.type])} />
                    ))}
                  </span>
                ) : null}
                {items.slice(0, 3).map((item) => (
                  <span
                    key={`${item.type}-${item.id}`}
                    aria-hidden="true"
                    className={cn("hidden rounded-md px-1.5 py-1 text-xs leading-4 font-semibold break-words sm:line-clamp-2", PILL[item.type])}
                  >
                    {pillText(item)}
                  </span>
                ))}
                {items.length > 3 ? (
                  <span aria-hidden="true" className="hidden text-xs font-semibold text-tinta-suave sm:inline">
                    +{items.length - 3}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <Modal open={selected !== null} onClose={() => setSelected(null)} title={selected ? capitalize(longDate(selected)) : ""}>
        {selectedItems.length === 0 ? (
          <p className="text-tinta-suave">Nenhum compromisso neste dia.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedItems.map((item) => (
              <li key={`${item.type}-${item.id}`} className="flex flex-col gap-1 rounded-xl border border-linha p-3">
                <span className="flex items-start gap-2">
                  <span aria-hidden="true" className={cn("mt-1.5 size-3 shrink-0 rounded", PILL[item.type])} />
                  <span className="flex min-w-0 flex-col">
                    <strong className="font-semibold break-words">
                      {item.type === "WEDDING"
                        ? `Casamento de ${item.title}`
                        : item.type === "BLOCKED"
                          ? "Data bloqueada"
                          : `${item.title}${item.time ? ` · ${formatTime(item.time)}` : ""}`}
                    </strong>
                    {item.type === "WEDDING" && item.location ? (
                      <span className="text-sm text-tinta-suave">{item.location}</span>
                    ) : null}
                    {item.type === "BLOCKED" && item.title !== "Data bloqueada" ? (
                      <span className="text-sm text-tinta-suave">{item.title}</span>
                    ) : null}
                    {item.type === "MEETING" && item.notes ? (
                      <span className="text-sm whitespace-pre-line break-words text-tinta-suave">{item.notes}</span>
                    ) : null}
                  </span>
                </span>
                <span className="flex flex-wrap gap-1">
                  {item.type === "WEDDING" || item.leadId ? (
                    <Link
                      href={`/fornecedor/pedidos/${item.type === "WEDDING" ? item.id : item.leadId}`}
                      className={cn(BTN_QUIET, "px-3 text-sm text-ameixa")}
                    >
                      Ver pedido
                    </Link>
                  ) : null}
                  {item.type !== "WEDDING" ? (
                    <DeleteEventButton
                      eventId={item.id}
                      label={item.type === "BLOCKED" ? "Desbloquear" : "Excluir"}
                      onDeleted={() => setSelected(null)}
                    />
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2 border-t border-linha pt-4">
          <button type="button" onClick={() => openFromDay("MEETING")} className={BTN_PRIMARY}>
            <CalendarPlus aria-hidden="true" className="size-[18px]" />
            Nova reunião neste dia
          </button>
          {!selectedBlocked ? (
            <button type="button" onClick={() => openFromDay("BLOCKED")} className={BTN_SECONDARY}>
              <CalendarX2 aria-hidden="true" className="size-[18px]" />
              Bloquear este dia
            </button>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
