// Regras de prazo e agrupamento das tarefas (puro: datas em chave AAAA-MM-DD, "hoje" vem do servidor).
import { SituacaoDaTarefa, type ItemDoQuadro } from "@/types/kanban";

export type FiltroDeTarefas = "abertas" | "atrasadas" | "concluidas";

export const UM_DIA_EM_MS = 86_400_000;
export const milissegundosDoDia = (key: string) => Date.parse(`${key}T00:00:00Z`);
// As datas das tarefas são guardadas à meia-noite UTC do dia escolhido: lemos o dia em UTC.
export const chaveDoPrazo = (t: ItemDoQuadro) => (t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : null);

export const tarefaEstaConcluida = (t: ItemDoQuadro) => t.status === SituacaoDaTarefa.DONE;

export function tarefasAtrasadas(abertas: ItemDoQuadro[], todayKey: string) {
  return abertas.filter((t) => {
    const k = chaveDoPrazo(t);
    return !!k && k < todayKey;
  });
}

export interface GrupoDeTarefas {
  id: string;
  title: string;
  tone: "normal" | "perigo";
  items: ItemDoQuadro[];
}

const porPrazo = (a: ItemDoQuadro, b: ItemDoQuadro) => (chaveDoPrazo(a) ?? "9999").localeCompare(chaveDoPrazo(b) ?? "9999") || a.position - b.position;

/** Divide as tarefas do filtro em atrasadas, desta semana, próximos meses e sem prazo (grupos vazios somem). */
export function agruparTarefas(tasks: ItemDoQuadro[], filter: FiltroDeTarefas, todayKey: string): GrupoDeTarefas[] {
  if (filter === "concluidas") return [{ id: "concluidas", title: "Concluídas", tone: "normal", items: tasks.filter(tarefaEstaConcluida).sort(porPrazo) }];
  const abertas = tasks.filter((t) => !tarefaEstaConcluida(t));
  const lista = filter === "atrasadas" ? tarefasAtrasadas(abertas, todayKey) : abertas;
  const weekEnd = new Date(milissegundosDoDia(todayKey) + 7 * UM_DIA_EM_MS).toISOString().slice(0, 10);
  const entre = (t: ItemDoQuadro, de: (k: string) => boolean) => {
    const k = chaveDoPrazo(t);
    return k !== null && de(k);
  };
  const grupos: GrupoDeTarefas[] = [
    { id: "atrasadas", title: "Atrasadas", tone: "perigo", items: lista.filter((t) => entre(t, (k) => k < todayKey)).sort(porPrazo) },
    { id: "semana", title: "Esta semana", tone: "normal", items: lista.filter((t) => entre(t, (k) => k >= todayKey && k <= weekEnd)).sort(porPrazo) },
    { id: "depois", title: "Próximos meses", tone: "normal", items: lista.filter((t) => entre(t, (k) => k > weekEnd)).sort(porPrazo) },
    { id: "sem-data", title: "Sem prazo", tone: "normal", items: lista.filter((t) => chaveDoPrazo(t) === null).sort(porPrazo) },
  ];
  return grupos.filter((g) => g.items.length > 0);
}
