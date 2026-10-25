import { useDroppable } from "@dnd-kit/core";
import { Check, Trash2, TriangleAlert } from "lucide-react";
import { EtiquetaDeSituacao } from "@/components/painel/status-chip";
import { estiloDoBotaoDeIconeDePerigo, estiloDoCartao } from "@/components/painel/styles";
import { LinhaDoConvidado } from "./linha-do-convidado";
import { lugaresDe, type MesaComConvidados } from "./tipos";

interface PropriedadesDoCartaoDaMesa {
  table: MesaComConvidados;
  number: number;
  tables: MesaComConvidados[];
  onDelete: () => void;
  onMove: (guestId: string, to: string) => void;
}

function OcupacaoDaMesa({ occupied, capacity, soltando }: { occupied: number; capacity: number; soltando: boolean }) {
  if (occupied > capacity) {
    return (
      <EtiquetaDeSituacao tone="perigo" icon={<TriangleAlert className="size-4" aria-hidden="true" />}>
        {occupied} de {capacity} · passou
      </EtiquetaDeSituacao>
    );
  }
  if (occupied === capacity) {
    return (
      <EtiquetaDeSituacao tone="sucesso" icon={<Check className="size-4" aria-hidden="true" />}>
        {occupied} de {capacity} · completa
      </EtiquetaDeSituacao>
    );
  }
  return (
    <span className="text-sm text-tinta-suave">
      {occupied} de {capacity}
      {soltando && " · solte aqui"}
    </span>
  );
}

/** Mesa: cartão com o círculo, o nome e a ocupação. */
export function CartaoDaMesa({ table, number, tables, onDelete, onMove }: PropriedadesDoCartaoDaMesa) {
  const { isOver, setNodeRef } = useDroppable({ id: table.id });
  // Total de lugares ocupados (convidado + acompanhantes)
  const occupied = table.guests.reduce((acc, g) => acc + lugaresDe(g), 0);
  const borda = occupied === table.capacity ? "border-4 border-dotted border-sucesso" : occupied > table.capacity ? "border-4 border-dotted border-perigo" : "";

  return (
    <article
      ref={setNodeRef}
      aria-label={`Mesa ${table.name}`}
      className={`${estiloDoCartao} relative flex flex-col items-center gap-2 p-4 text-center transition-[outline-color] ${isOver ? "outline-2 outline-offset-[3px] outline-dashed outline-ameixa" : ""}`}
    >
      <div className="absolute right-1 top-1">
        <button type="button" onClick={onDelete} aria-label={`Excluir a mesa ${table.name}`} className={estiloDoBotaoDeIconeDePerigo}>
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className={`grid size-24 place-items-center rounded-full bg-areia font-num text-[28px] text-tinta [font-variant-numeric:lining-nums] ${borda}`} aria-hidden="true">
        {number}
      </div>
      <strong className="max-w-full break-words font-semibold text-tinta">{table.name}</strong>
      <OcupacaoDaMesa occupied={occupied} capacity={table.capacity} soltando={isOver} />
      {table.guests.length > 0 ? (
        <ul className="mt-2 flex w-full flex-col gap-1.5">
          {table.guests.map((g) => (
            <LinhaDoConvidado key={g.id} guest={g} tables={tables} currentTableId={table.id} onMove={onMove} />
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-tinta-suave">Arraste alguém para cá, ou escolha a mesa na lista.</p>
      )}
    </article>
  );
}
