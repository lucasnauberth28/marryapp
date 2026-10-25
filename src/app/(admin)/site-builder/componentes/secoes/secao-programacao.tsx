import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { MAXIMO_DE_MOMENTOS_DA_PROGRAMACAO, type MomentoDaProgramacao } from "@/components/public/site-do-casamento/modelos/catalogo";
import { Entrada } from "@/components/ui/input";
import type { EditorDoSite } from "../use-configuracoes-do-site";

const VAZIO: MomentoDaProgramacao = { title: "", day: "", time: "", place: "" };

/** Lê as linhas como o casal as deixou, inclusive as ainda sem título (o site só mostra as que têm). */
function lerLinhas(bruto: string | null | undefined): MomentoDaProgramacao[] {
  try {
    const lista = JSON.parse(bruto ?? "[]");
    return Array.isArray(lista) ? lista.map((m) => ({ ...VAZIO, ...m })).slice(0, MAXIMO_DE_MOMENTOS_DA_PROGRAMACAO) : [];
  } catch {
    return [];
  }
}

function LinhaDoMomento({ indice, total, momento, aoMudar, aoMover, aoRemover }: { indice: number; total: number; momento: MomentoDaProgramacao; aoMudar: (m: Partial<MomentoDaProgramacao>) => void; aoMover: (passo: -1 | 1) => void; aoRemover: () => void }) {
  const botao = "grid size-9 place-items-center rounded-full border border-linha text-tinta-suave disabled:opacity-40";
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-linha bg-linho p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-tinta">Momento {indice + 1}</span>
        <span className="flex gap-1.5">
          <button type="button" className={botao} aria-label={`Subir o momento ${indice + 1}`} disabled={indice === 0} onClick={() => aoMover(-1)}><ArrowUp className="size-4" aria-hidden="true" /></button>
          <button type="button" className={botao} aria-label={`Descer o momento ${indice + 1}`} disabled={indice === total - 1} onClick={() => aoMover(1)}><ArrowDown className="size-4" aria-hidden="true" /></button>
          <button type="button" className={botao} aria-label={`Remover o momento ${indice + 1}`} onClick={aoRemover}><Trash2 className="size-4" aria-hidden="true" /></button>
        </span>
      </div>
      <Entrada id={`momento-${indice}-titulo`} label="O que acontece" value={momento.title} maxLength={80} onChange={(e) => aoMudar({ title: e.target.value })} placeholder="Ex.: Jantar de boas-vindas" />
      <div className="grid grid-cols-2 gap-3">
        <Entrada id={`momento-${indice}-dia`} label="Dia" optional value={momento.day} maxLength={60} onChange={(e) => aoMudar({ day: e.target.value })} placeholder="Sexta, 11 de setembro" />
        <Entrada id={`momento-${indice}-hora`} label="Horário" optional value={momento.time} maxLength={20} onChange={(e) => aoMudar({ time: e.target.value })} placeholder="19h" />
      </div>
      <Entrada id={`momento-${indice}-local`} label="Local" optional value={momento.place} maxLength={120} onChange={(e) => aoMudar({ place: e.target.value })} placeholder="Nome do lugar" />
    </li>
  );
}

export function SecaoDaProgramacao({ site }: { site: EditorDoSite }) {
  const linhas = lerLinhas(site.configuracoes.programJson);
  const gravar = (lista: MomentoDaProgramacao[]) => site.atualizar({ programJson: JSON.stringify(lista) });
  const mover = (i: number, passo: -1 | 1) => {
    const lista = [...linhas];
    [lista[i], lista[i + passo]] = [lista[i + passo], lista[i]];
    gravar(lista);
  };
  return (
    <>
      <p className="text-sm text-tinta-suave">Os modelos mostram estes momentos como o desenho deles pede. Sem nada aqui, o site usa a cerimônia e a recepção.</p>
      {linhas.length > 0 && (
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {linhas.map((m, i) => (
            <LinhaDoMomento key={i} indice={i} total={linhas.length} momento={m} aoMudar={(p) => gravar(linhas.map((x, j) => (j === i ? { ...x, ...p } : x)))} aoMover={(passo) => mover(i, passo)} aoRemover={() => gravar(linhas.filter((_, j) => j !== i))} />
          ))}
        </ol>
      )}
      <button type="button" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm} w-fit`} disabled={linhas.length >= MAXIMO_DE_MOMENTOS_DA_PROGRAMACAO} onClick={() => gravar([...linhas, VAZIO])}>
        <Plus className="size-4" aria-hidden="true" /> Adicionar momento
      </button>
    </>
  );
}
