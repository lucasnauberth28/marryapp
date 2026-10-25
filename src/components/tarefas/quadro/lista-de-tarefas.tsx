import { SituacaoDaTarefa, type ItemDoQuadro } from "@/types/kanban";
import { estiloDoCartao, estiloDoSobretitulo } from "@/components/painel/styles";
import { Check } from "lucide-react";
import { EtiquetaDePrazo } from "./etiqueta-de-prazo";
import { tarefaEstaConcluida, type FiltroDeTarefas, type GrupoDeTarefas } from "./prazos";

interface PropriedadesDoItem {
  task: ItemDoQuadro;
  todayKey: string;
  aoAlternar: (t: ItemDoQuadro) => void;
  aoEditar: (t: ItemDoQuadro) => void;
}

function ItemDaTarefa({ task: t, todayKey, aoAlternar, aoEditar }: PropriedadesDoItem) {
  const isDone = tarefaEstaConcluida(t);
  const meta = [t.assignee ? `Responsável: ${t.assignee}` : null, t.status === SituacaoDaTarefa.IN_PROGRESS ? "Em andamento" : null].filter(Boolean).join(" · ");
  return (
    <li className="flex min-h-14 items-center gap-1 border-b border-linha last:border-b-0">
      <label className="grid size-11 shrink-0 cursor-pointer place-items-center">
        <input type="checkbox" checked={isDone} onChange={() => aoAlternar(t)} aria-label={isDone ? `Reabrir ${t.title}` : `Concluir ${t.title}`} className="size-5 accent-[var(--color-ameixa)]" />
      </label>
      <button type="button" onClick={() => aoEditar(t)} className="flex min-w-0 flex-1 cursor-pointer flex-col py-2 text-left" aria-label={`Editar ${t.title}`}>
        <span className={`font-semibold ${isDone ? "text-tinta-suave line-through" : "text-tinta"}`}>{t.title}</span>
        {(meta || t.description) && <span className="line-clamp-1 text-sm text-tinta-suave">{[meta, t.description?.split("\n")[0]].filter(Boolean).join(" · ")}</span>}
        {/* Celular: o prazo fica embaixo do texto */}
        <span className="mt-1 w-fit sm:hidden">
          <EtiquetaDePrazo task={t} todayKey={todayKey} />
        </span>
      </button>
      <span className="shrink-0 pr-1 max-sm:hidden">
        <EtiquetaDePrazo task={t} todayKey={todayKey} />
      </span>
    </li>
  );
}

const TEXTO_SEM_TAREFAS: Record<FiltroDeTarefas, string> = {
  atrasadas: "Nada atrasado. Está tudo em dia.",
  concluidas: "Ainda não há tarefas concluídas.",
  abertas: "Não há tarefas abertas. Que alegria!",
};

interface PropriedadesDaLista extends Omit<PropriedadesDoItem, "task"> {
  groups: GrupoDeTarefas[];
  filter: FiltroDeTarefas;
}

export function ListaDeTarefas({ groups, filter, ...acoes }: PropriedadesDaLista) {
  if (groups.length === 0) {
    return (
      <div className={`${estiloDoCartao} flex items-center gap-3 px-6 py-10 text-tinta-suave`}>
        <Check className="size-5 shrink-0 text-sucesso" aria-hidden="true" />
        {TEXTO_SEM_TAREFAS[filter]}
      </div>
    );
  }
  return (
    <div className={`${estiloDoCartao} p-4 sm:p-6`}>
      {groups.map((g, gi) => (
        <section key={g.id} aria-labelledby={`grupo-${g.id}`} className={gi > 0 ? "mt-6" : ""}>
          <h2 id={`grupo-${g.id}`} className={`${estiloDoSobretitulo} mb-2 ${g.tone === "perigo" ? "!text-perigo" : ""}`}>
            {g.title}
          </h2>
          <ul>
            {g.items.map((t) => (
              <ItemDaTarefa key={t.id} task={t} {...acoes} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
