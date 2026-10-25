import { Pencil, Trash2 } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";

interface PropriedadesDasAcoesDaLinha {
  rotuloEditar: string;
  rotuloExcluir: string;
  aoEditar: () => void;
  aoExcluir: () => void;
}

/** Os dois botões de ícone no fim de cada linha: editar e excluir. */
export function AcoesDaLinha({ rotuloEditar, rotuloExcluir, aoEditar, aoExcluir }: PropriedadesDasAcoesDaLinha) {
  return (
    <div className="flex justify-end gap-1">
      <button type="button" aria-label={rotuloEditar} className={`${estiloDoBotao.quiet} !min-w-11 !px-0`} onClick={aoEditar}>
        <Pencil className="size-4" aria-hidden="true" />
      </button>
      <button type="button" aria-label={rotuloExcluir} className={`${estiloDoBotao.quiet} !min-w-11 !px-0 text-perigo hover:bg-perigo-suave`} onClick={aoExcluir}>
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
