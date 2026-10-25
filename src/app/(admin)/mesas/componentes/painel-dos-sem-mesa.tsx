import { useDroppable } from "@dnd-kit/core";
import { Users } from "lucide-react";
import { estiloDaDicaDoPainel, estiloDoCartao } from "@/components/painel/styles";
import { LinhaDoConvidado } from "./linha-do-convidado";
import { SEM_MESA, type ConvidadoDaMesa, type MesaComConvidados } from "./tipos";

interface PropriedadesDoPainel {
  guests: ConvidadoDaMesa[];
  tables: MesaComConvidados[];
  totalConfirmed: number;
  onMove: (guestId: string, to: string) => void;
}

/** Confirmados que ainda não têm mesa. */
export function PainelDosSemMesa({ guests, tables, totalConfirmed, onMove }: PropriedadesDoPainel) {
  const { setNodeRef, isOver } = useDroppable({ id: SEM_MESA });
  return (
    <section
      ref={setNodeRef}
      aria-labelledby="sem-mesa"
      className={`${estiloDoCartao} flex w-full flex-col gap-2 p-4 sm:p-6 lg:sticky lg:top-24 lg:max-w-80 lg:flex-none ${isOver ? "outline-2 outline-offset-[3px] outline-dashed outline-ameixa" : ""}`}
    >
      <h2 id="sem-mesa" className="text-lg font-semibold leading-7 text-tinta">
        Sem mesa · {guests.length}
      </h2>
      {guests.length > 0 && <p className={`${estiloDaDicaDoPainel} mb-2`}>Arraste pela alça para uma mesa, ou toque no ícone de troca e escolha.</p>}
      {guests.length > 0 ? (
        <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto lg:max-h-[640px]">
          {guests.map((g) => (
            <LinhaDoConvidado key={g.id} guest={g} tables={tables} currentTableId={null} onMove={onMove} />
          ))}
        </ul>
      ) : (
        <p className="flex items-start gap-2 text-sm text-tinta-suave">
          <Users className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {totalConfirmed > 0 ? "Todos os confirmados já têm mesa." : "Quem confirmar presença aparece aqui para ganhar mesa."}
        </p>
      )}
    </section>
  );
}
