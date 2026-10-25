import { EtiquetaDeConfirmacao } from "@/components/painel/status-chip";
import { estiloDoCartao } from "@/components/painel/styles";
import type { ConvidadoLocal } from "@/types/local";
import type { LinhaDoConvidado } from "./tipos";
import { iniciaisDoNome, rotuloDosLugares } from "./utilitarios";

interface PropriedadesDosCartoes {
  convidados: LinhaDoConvidado[];
  removendoId: string | null;
  aoEditar: (g: ConvidadoLocal) => void;
}

/** Celular: um cartão por convidado, o toque abre a edição. */
export function CartoesDeConvidados({ convidados, removendoId, aoEditar }: PropriedadesDosCartoes) {
  return (
    <ul className="flex flex-col gap-2 md:hidden">
      {convidados.map((g) => (
        <li key={g.id} aria-busy={removendoId === g.id || undefined}>
          <button
            type="button"
            onClick={() => aoEditar(g)}
            disabled={removendoId === g.id}
            aria-label={`Editar ${g.name}`}
            className={`${estiloDoCartao} flex min-h-14 w-full cursor-pointer items-center gap-3 px-3.5 py-3 text-left disabled:opacity-50`}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-areia text-sm font-semibold text-tinta" aria-hidden="true">
              {iniciaisDoNome(g.name)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate font-semibold text-tinta">{g.name}</strong>
              <span className="text-sm text-tinta-suave">{[g.category, rotuloDosLugares(g)].filter(Boolean).join(" · ")}</span>
            </span>
            <EtiquetaDeConfirmacao status={g.rsvpStatus} />
          </button>
        </li>
      ))}
    </ul>
  );
}
