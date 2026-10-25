import { Trash2 } from "lucide-react";
import { EtiquetaDeConfirmacao } from "@/components/painel/status-chip";
import { estiloDoBotao, estiloDoBotaoDeIconeDePerigo, estiloDoCartao, estiloDoSobretitulo } from "@/components/painel/styles";
import { formatarTelefone } from "@/lib/formatacao/telefone";
import type { ConvidadoLocal } from "@/types/local";
import { SeloDoLink } from "./selo-do-link";
import type { LinhaDoConvidado } from "./tipos";
import { quantidadeDeLugares } from "./utilitarios";

interface PropriedadesDaTabela {
  convidados: LinhaDoConvidado[];
  removendoId: string | null;
  aoEditar: (g: ConvidadoLocal) => void;
  aoRemover: (g: ConvidadoLocal) => void;
}

const COLUNAS = [
  ["Nome", "px-4"],
  ["Grupo", "px-2"],
  ["Lugares", "px-2"],
  ["Resposta", "px-2"],
  ["Mesa", "px-2"],
] as const;

function LinhaDaTabela({ g, removendo, aoEditar, aoRemover }: { g: LinhaDoConvidado; removendo: boolean } & Pick<PropriedadesDaTabela, "aoEditar" | "aoRemover">) {
  return (
    <tr aria-busy={removendo || undefined} className={`border-b border-linha last:border-b-0 hover:bg-ameixa-suave/40 ${removendo ? "pointer-events-none opacity-50" : ""}`}>
      <td className="px-4 py-3">
        <button type="button" onClick={() => aoEditar(g)} className="block cursor-pointer rounded text-left font-semibold text-tinta hover:text-ameixa">
          {g.name}
        </button>
        <span className="block text-sm text-tinta-suave tabular-nums">{g.phone ? formatarTelefone(g.phone) : "Sem telefone"}</span>
        <SeloDoLink guest={g} />
        {g.companionsNames && <span className="block text-sm text-tinta-suave">Acompanhantes: {g.companionsNames}</span>}
        {g.dietaryRestrictions && <span className="block text-sm text-aviso">Restrição: {g.dietaryRestrictions}</span>}
      </td>
      <td className="px-2 py-3 text-tinta-suave">{g.category || "Sem grupo"}</td>
      <td className="px-2 py-3 tabular-nums">{quantidadeDeLugares(g)}</td>
      <td className="px-2 py-3">
        <EtiquetaDeConfirmacao status={g.rsvpStatus} />
      </td>
      <td className="px-2 py-3 text-tinta-suave">{g.table?.name ?? "Sem mesa"}</td>
      <td className="px-4 py-2">
        <div className="flex items-center justify-end gap-1">
          <button type="button" onClick={() => aoEditar(g)} className={`${estiloDoBotao.quiet} ${estiloDoBotao.sm}`} aria-label={`Editar ${g.name}`}>
            Editar
          </button>
          <button type="button" onClick={() => aoRemover(g)} className={estiloDoBotaoDeIconeDePerigo} aria-label={`Excluir ${g.name}`}>
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/** Computador: tabela com linhas de 56px. */
export function TabelaDeConvidados({ convidados, removendoId, aoEditar, aoRemover }: PropriedadesDaTabela) {
  return (
    <div className={`${estiloDoCartao} hidden overflow-hidden md:block`}>
      <table className="w-full border-collapse text-left text-[15px]">
        <thead>
          <tr className="border-b border-linha">
            {COLUNAS.map(([titulo, espaco]) => (
              <th key={titulo} scope="col" className={`${estiloDoSobretitulo} ${espaco} py-3`}>{titulo}</th>
            ))}
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {convidados.map((g) => (
            <LinhaDaTabela key={g.id} g={g} removendo={removendoId === g.id} aoEditar={aoEditar} aoRemover={aoRemover} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
