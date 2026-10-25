import { ListChecks } from "lucide-react";
import { estiloDoBotao, estiloDoCartao } from "@/components/painel/styles";
import type { FiltroDeTarefas } from "./prazos";

interface PropriedadesDosFiltros {
  filter: FiltroDeTarefas;
  aoMudar: (f: FiltroDeTarefas) => void;
  abertas: number;
  atrasadas: number;
  concluidas: number;
}

export function FiltrosDeTarefas({ filter, aoMudar, abertas, atrasadas, concluidas }: PropriedadesDosFiltros) {
  const chips: Array<{ value: FiltroDeTarefas; label: string; tone: string }> = [
    { value: "abertas", label: `Abertas · ${abertas}`, tone: "bg-areia text-tinta" },
    { value: "atrasadas", label: `Atrasadas · ${atrasadas}`, tone: "bg-perigo-suave text-perigo" },
    { value: "concluidas", label: `Concluídas · ${concluidas}`, tone: "bg-areia text-tinta-suave" },
  ];
  return (
    <div role="group" aria-label="Filtrar tarefas" className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
      {chips.map((c) => (
        <button
          key={c.value}
          type="button"
          aria-pressed={filter === c.value}
          onClick={() => aoMudar(c.value)}
          className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-colors md:min-h-10 ${filter === c.value ? "bg-ameixa text-on-ameixa" : `${c.tone} hover:brightness-95`}`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

export function SemTarefas({ aoCriar }: { aoCriar: () => void }) {
  return (
    <div className={`${estiloDoCartao} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
      <span className="grid size-12 place-items-center rounded-full bg-ameixa-suave text-ameixa">
        <ListChecks className="size-6" aria-hidden="true" />
      </span>
      <h2 className="font-display text-[26px] font-medium leading-8 text-tinta">Nenhuma tarefa ainda</h2>
      <p className="max-w-md text-tinta-suave">Anotem o que não pode ser esquecido, como escolher o local, fechar o buffet e montar a lista de convidados. Cada tarefa pode ter prazo e um responsável.</p>
      <button type="button" onClick={aoCriar} className={`${estiloDoBotao.primary} mt-2`}>
        Criar a primeira tarefa
      </button>
    </div>
  );
}
