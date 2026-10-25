import { Check } from "lucide-react";
import { estiloDoBotao } from "@/components/painel/styles";
import { pluralizar } from "@/lib/formatacao/plural";
import { CLASSE_DO_TITULO, type ResultadoDaImportacao } from "./tipos";

function resumoDoResultado({ duplicates, invalid }: ResultadoDaImportacao) {
  const partes = [
    duplicates > 0 ? pluralizar(duplicates, "já estava na lista e foi pulado", "já estavam na lista e foram pulados") : null,
    invalid > 0 ? pluralizar(invalid, "linha com problema ficou de fora", "linhas com problema ficaram de fora") : null,
  ].filter(Boolean);
  if (partes.length === 0) return "Todos já aparecem na lista de convidados.";
  return `${partes.join(". ")}.`;
}

interface PropriedadesDaEtapaPronto {
  result: ResultadoDaImportacao;
  titulo: React.Ref<HTMLHeadingElement>;
  aoFechar: () => void;
}

export function EtapaPronto({ result, titulo, aoFechar }: PropriedadesDaEtapaPronto) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-sucesso-suave text-sucesso">
        <Check className="size-6" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1" role="status" aria-live="polite">
        <h3 ref={titulo} tabIndex={-1} className={CLASSE_DO_TITULO}>
          {result.added === 0 ? "Nenhum convidado novo" : pluralizar(result.added, "convidado adicionado", "convidados adicionados")}
        </h3>
        <p className="text-tinta-suave">{resumoDoResultado(result)}</p>
      </div>
      <button type="button" onClick={aoFechar} className={estiloDoBotao.primary}>
        Ver a lista
      </button>
    </div>
  );
}
