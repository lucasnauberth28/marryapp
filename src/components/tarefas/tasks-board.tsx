"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ListChecks, Plus, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { BoardItem, TaskStatus } from "@/types/kanban";
import { createTask, deleteTask, updateTask, updateTaskStatus } from "@/actions/tasks";
import { PageHeader } from "@/components/admin/page-header";
import { StatusChip } from "@/components/painel/status-chip";
import { btn, card, overline } from "@/components/painel/styles";
import { TaskFormModal, type TaskFormData } from "./task-form-modal";

export type Filter = "abertas" | "atrasadas" | "concluidas";

interface TasksBoardProps {
  initialTasks: BoardItem[];
  /** Hoje em São Paulo (AAAA-MM-DD), vindo do servidor: o agrupamento por prazo parte dele. */
  todayKey: string;
  /** Dias até o casamento, quando há data. */
  daysLeft: number | null;
  initialFilter: Filter;
  /** Cartão de sugestão da Madrinha (decidido no servidor com dados reais). */
  suggestion?: ReactNode;
}

const DAY = 86_400_000;
const dayMs = (key: string) => Date.parse(`${key}T00:00:00Z`);
// As datas das tarefas são guardadas à meia-noite UTC do dia escolhido: lemos o dia em UTC.
const dueKey = (t: BoardItem) => (t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : null);

const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });
const monthShort = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });
const monthYear = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
// "5 de out." vira "5 out"; "nov." vira "Nov"
const short = (d: Intl.DateTimeFormat, key: string) => {
  const text = d.format(new Date(`${key}T00:00:00Z`)).replace(".", "").replace(" de ", " ");
  return /^\d/.test(text) ? text : text.charAt(0).toUpperCase() + text.slice(1);
};

function isDoneTask(t: BoardItem) {
  return t.status === TaskStatus.DONE;
}

function DueChip({ task, todayKey }: { task: BoardItem; todayKey: string }) {
  const key = dueKey(task);
  if (!key || isDoneTask(task)) return null;
  const diff = Math.round((dayMs(key) - dayMs(todayKey)) / DAY);
  if (diff < 0) {
    return (
      <StatusChip tone="perigo" icon={<TriangleAlert className="size-4" aria-hidden="true" />}>
        Venceu {short(dayMonth, key)}
      </StatusChip>
    );
  }
  if (diff <= 7) return <StatusChip tone={diff <= 3 ? "aviso" : "neutro"}>{diff === 0 ? "Hoje" : `Até ${short(dayMonth, key)}`}</StatusChip>;
  const sameYear = key.slice(0, 4) === todayKey.slice(0, 4);
  return <StatusChip tone="neutro">{short(sameYear ? monthShort : monthYear, key)}</StatusChip>;
}

export function TasksBoard({ initialTasks, todayKey, daysLeft, initialFilter, suggestion }: TasksBoardProps) {
  const [tasks, setTasks] = useState<BoardItem[]>(initialTasks);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BoardItem | null>(null);

  const done = tasks.filter(isDoneTask).length;
  const total = tasks.length;
  const open = tasks.filter((t) => !isDoneTask(t));
  const overdue = open.filter((t) => {
    const k = dueKey(t);
    return !!k && k < todayKey;
  });
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const groups = useMemo(() => {
    const byDue = (a: BoardItem, b: BoardItem) => (dueKey(a) ?? "9999").localeCompare(dueKey(b) ?? "9999") || a.position - b.position;
    const key = (t: BoardItem) => dueKey(t);
    const weekEnd = new Date(dayMs(todayKey) + 7 * DAY).toISOString().slice(0, 10);

    if (filter === "concluidas") {
      return [{ id: "concluidas", title: "Concluídas", tone: "normal" as const, items: tasks.filter(isDoneTask).sort(byDue) }];
    }
    const list = filter === "atrasadas" ? overdue : open;
    const g = [
      { id: "atrasadas", title: "Atrasadas", tone: "perigo" as const, items: list.filter((t) => (key(t) ?? "9") < todayKey && key(t) !== null).sort(byDue) },
      { id: "semana", title: "Esta semana", tone: "normal" as const, items: list.filter((t) => key(t) !== null && key(t)! >= todayKey && key(t)! <= weekEnd).sort(byDue) },
      { id: "depois", title: "Próximos meses", tone: "normal" as const, items: list.filter((t) => key(t) !== null && key(t)! > weekEnd).sort(byDue) },
      { id: "sem-data", title: "Sem prazo", tone: "normal" as const, items: list.filter((t) => key(t) === null).sort(byDue) },
    ];
    return g.filter((x) => x.items.length > 0);
  }, [tasks, filter, open, overdue, todayKey]);

  async function toggle(task: BoardItem) {
    const next = isDoneTask(task) ? TaskStatus.TODO : TaskStatus.DONE;
    setTasks((cur) => cur.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    const res = await updateTaskStatus(task.id, next, task.position, task.type);
    if (!res.success) {
      setTasks((cur) => cur.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
      toast.error(res.error || "Não deu para atualizar a tarefa. Tente de novo.");
    } else if (next === TaskStatus.DONE) {
      toast.success("Tarefa concluída.", { action: { label: "Desfazer", onClick: () => void toggle({ ...task, status: TaskStatus.DONE }) } });
    }
  }

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(task: BoardItem) {
    setEditing(task);
    setModalOpen(true);
  }

  async function save(data: TaskFormData): Promise<boolean> {
    const toastId = toast.loading(editing ? "Salvando a tarefa..." : "Criando a tarefa...");
    if (editing) {
      const res = await updateTask(editing.id, data);
      if (res.success && res.data) {
        const updated: BoardItem = { ...res.data, type: "MANUAL" };
        setTasks((cur) => cur.map((t) => (t.id === updated.id ? updated : t)));
        toast.success("Tarefa salva.", { id: toastId });
        return true;
      }
      toast.error(res.error || "Não deu para salvar a tarefa. Tente de novo.", { id: toastId });
      return false;
    }
    const res = await createTask({
      title: data.title,
      status: data.status,
      description: data.description ?? undefined,
      assignee: data.assignee ?? undefined,
      dueDate: data.dueDate ?? undefined,
    });
    if (res.success && res.data) {
      setTasks((cur) => [...cur, { ...res.data, type: "MANUAL" }]);
      toast.success("Tarefa criada.", { id: toastId });
      return true;
    }
    toast.error(res.error || "Não deu para criar a tarefa. Tente de novo.", { id: toastId });
    return false;
  }

  async function remove(id: string) {
    const toastId = toast.loading("Removendo a tarefa...");
    const res = await deleteTask(id);
    if (res.success) {
      setTasks((cur) => cur.filter((t) => t.id !== id));
      toast.success("Tarefa removida.", { id: toastId });
      return true;
    }
    toast.error(res.error || "Não deu para remover agora. Tente de novo.", { id: toastId });
    return false;
  }

  const left = daysLeft !== null && daysLeft > 0 ? (daysLeft === 1 ? " · falta 1 dia" : ` · faltam ${daysLeft} dias`) : daysLeft === 0 ? " · o casamento é hoje" : "";

  const chips: Array<{ value: Filter; label: string; tone: string }> = [
    { value: "abertas", label: `Abertas · ${open.length}`, tone: "bg-areia text-tinta" },
    { value: "atrasadas", label: `Atrasadas · ${overdue.length}`, tone: "bg-perigo-suave text-perigo" },
    { value: "concluidas", label: `Concluídas · ${done}`, tone: "bg-areia text-tinta-suave" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Organização"
        title="Tarefas"
        description={total === 0 ? "O que falta fazer até o grande dia, num só lugar." : `${done} de ${total} ${total === 1 ? "concluída" : "concluídas"}${left}`}
        actions={
          <button type="button" onClick={openNew} className={`${btn.primary} max-md:hidden`}>
            <Plus className="size-4" aria-hidden="true" />
            Nova tarefa
          </button>
        }
      />

      {total > 0 && (
        <div role="progressbar" aria-label="Tarefas concluídas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2 overflow-hidden rounded-full bg-areia">
          <div className="h-full rounded-full bg-ameixa transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
      )}

      {total === 0 ? (
        <div className={`${card} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
          <span className="grid size-12 place-items-center rounded-full bg-ameixa-suave text-ameixa">
            <ListChecks className="size-6" aria-hidden="true" />
          </span>
          <h2 className="font-display text-[26px] font-medium leading-8 text-tinta">Nenhuma tarefa ainda</h2>
          <p className="max-w-md text-tinta-suave">Anotem o que não pode ser esquecido, como escolher o local, fechar o buffet e montar a lista de convidados. Cada tarefa pode ter prazo e um responsável.</p>
          <button type="button" onClick={openNew} className={`${btn.primary} mt-2`}>
            Criar a primeira tarefa
          </button>
        </div>
      ) : (
        <>
          <div role="group" aria-label="Filtrar tarefas" className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
            {chips.map((c) => {
              const active = filter === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(c.value)}
                  className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-colors md:min-h-10 ${active ? "bg-ameixa text-on-ameixa" : `${c.tone} hover:brightness-95`}`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {groups.length === 0 ? (
            <div className={`${card} flex items-center gap-3 px-6 py-10 text-tinta-suave`}>
              <Check className="size-5 shrink-0 text-sucesso" aria-hidden="true" />
              {filter === "atrasadas" ? "Nada atrasado. Está tudo em dia." : filter === "concluidas" ? "Ainda não há tarefas concluídas." : "Não há tarefas abertas. Que alegria!"}
            </div>
          ) : (
            <div className={`${card} p-4 sm:p-6`}>
              {groups.map((g, gi) => (
                <section key={g.id} aria-labelledby={`grupo-${g.id}`} className={gi > 0 ? "mt-6" : ""}>
                  <h2 id={`grupo-${g.id}`} className={`${overline} mb-2 ${g.tone === "perigo" ? "!text-perigo" : ""}`}>
                    {g.title}
                  </h2>
                  <ul>
                    {g.items.map((t) => {
                      const isDone = isDoneTask(t);
                      const meta = [t.assignee ? `Responsável: ${t.assignee}` : null, t.status === TaskStatus.IN_PROGRESS ? "Em andamento" : null].filter(Boolean).join(" · ");
                      return (
                        <li key={t.id} className="flex min-h-14 items-center gap-1 border-b border-linha last:border-b-0">
                          <label className="grid size-11 shrink-0 cursor-pointer place-items-center">
                            <input type="checkbox" checked={isDone} onChange={() => void toggle(t)} aria-label={isDone ? `Reabrir ${t.title}` : `Concluir ${t.title}`} className="size-5 accent-[var(--color-ameixa)]" />
                          </label>
                          <button type="button" onClick={() => openEdit(t)} className="flex min-w-0 flex-1 cursor-pointer flex-col py-2 text-left" aria-label={`Editar ${t.title}`}>
                            <span className={`font-semibold ${isDone ? "text-tinta-suave line-through" : "text-tinta"}`}>{t.title}</span>
                            {(meta || t.description) && <span className="line-clamp-1 text-sm text-tinta-suave">{[meta, t.description?.split("\n")[0]].filter(Boolean).join(" · ")}</span>}
                            {/* Celular: o prazo fica embaixo do texto */}
                            <span className="mt-1 w-fit sm:hidden">
                              <DueChip task={t} todayKey={todayKey} />
                            </span>
                          </button>
                          <span className="shrink-0 pr-1 max-sm:hidden">
                            <DueChip task={t} todayKey={todayKey} />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {suggestion}

      <button
        type="button"
        onClick={openNew}
        aria-label="Nova tarefa"
        className="fixed bottom-24 right-4 z-30 grid size-14 cursor-pointer place-items-center rounded-t-full rounded-b-2xl bg-ameixa text-on-ameixa shadow-[var(--shadow-aceito-2)] transition-colors hover:bg-ameixa-hover md:hidden"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>

      <TaskFormModal open={modalOpen} onOpenChange={setModalOpen} task={editing} onSave={save} onDelete={remove} />
    </div>
  );
}
