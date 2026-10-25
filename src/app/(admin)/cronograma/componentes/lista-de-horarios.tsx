import { CalendarClock, Pencil, Trash2 } from "lucide-react";
import { estiloDoBotao, estiloDoBotaoDeIcone, estiloDoBotaoDeIconeDePerigo, estiloDoCartao } from "@/components/painel/styles";
import { rotuloDaHora, type EventoDaLinhaDoTempo } from "./tipos";

export function SemHorarios({ aoAdicionar }: { aoAdicionar: () => void }) {
  return (
    <div className={`${estiloDoCartao} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
      <span className="grid size-12 place-items-center rounded-full bg-ameixa-suave text-ameixa">
        <CalendarClock className="size-6" aria-hidden="true" />
      </span>
      <h2 className="font-display text-[26px] font-medium leading-8 text-tinta">Nenhum horário ainda</h2>
      <p className="max-w-md text-tinta-suave">Anotem a ordem do dia, da chegada dos fornecedores à pista de dança. Com tudo aqui, fornecedores e convidados sabem a hora de cada momento.</p>
      <button type="button" onClick={aoAdicionar} className={`${estiloDoBotao.primary} mt-2`}>
        Adicionar o primeiro horário
      </button>
    </div>
  );
}

interface PropriedadesDaLista {
  eventos: EventoDaLinhaDoTempo[];
  aoEditar: (e: EventoDaLinhaDoTempo) => void;
  aoExcluir: (e: EventoDaLinhaDoTempo) => void;
}

export function ListaDeHorarios({ eventos, aoEditar, aoExcluir }: PropriedadesDaLista) {
  return (
    <ol className="flex flex-col gap-3">
      {eventos.map((e) => (
        <li key={e.id} className={`${estiloDoCartao} grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5 sm:py-4`}>
          <span className="font-num text-[22px] leading-8 text-ameixa [font-variant-numeric:lining-nums] sm:text-[26px]">{rotuloDaHora(e.time)}</span>
          <div className="min-w-0">
            <strong className="block font-semibold text-tinta">{e.title}</strong>
            {e.description && <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-tinta-suave">{e.description}</p>}
          </div>
          <div className="flex items-center">
            <button type="button" onClick={() => aoEditar(e)} aria-label={`Editar ${e.title}`} className={estiloDoBotaoDeIcone}>
              <Pencil className="size-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => aoExcluir(e)} aria-label={`Excluir ${e.title}`} className={estiloDoBotaoDeIconeDePerigo}>
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
