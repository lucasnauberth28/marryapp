import Link from "next/link";
import { formatarHoraDoPainel, type SituacaoDoPedido } from "../../../../_lib/vendor-panel";
import type { ContextoDaAgenda } from "./dados";

export type SituacaoDaAgenda = { label: string; tone: "sucesso" | "perigo" | "suave"; note?: React.ReactNode };

function CasamentoJaFechado({ outros }: { outros: ContextoDaAgenda["otherWeddings"] }) {
  return (
    <>
      Casamento de{" "}
      {outros.map((w, i) => (
        <span key={w.id}>
          {i > 0 ? ", " : ""}
          <Link href={`/fornecedor/pedidos/${w.id}`} className="font-semibold text-ameixa underline-offset-2 hover:underline">
            {w.coupleName}
          </Link>
        </span>
      ))}{" "}
      já fechado nesse dia.
    </>
  );
}

/** "Sua agenda": casamentos fechados e datas bloqueadas ocupam o dia; reuniões, não. */
export function situacaoDaAgenda(day: Date | null, status: SituacaoDoPedido, { dayEvents, otherWeddings }: ContextoDaAgenda): SituacaoDaAgenda {
  const blocked = dayEvents.find((e) => e.kind === "BLOCKED");
  const meetings = dayEvents.filter((e) => e.kind === "MEETING");
  if (!day) return { label: "Sem data definida", tone: "suave" };
  if (status === "CLOSED") return { label: "Reservada para este casal", tone: "sucesso" };
  if (otherWeddings.length > 0) return { label: "Data ocupada", tone: "perigo", note: <CasamentoJaFechado outros={otherWeddings} /> };
  if (blocked) return { label: "Data ocupada", tone: "perigo", note: `Bloqueada na agenda: ${blocked.title}.` };
  return {
    label: "Data livre",
    tone: "sucesso",
    note: meetings.length > 0 ? `Você tem reunião nesse dia${meetings[0].time ? ` às ${formatarHoraDoPainel(meetings[0].time)}` : ""}.` : undefined,
  };
}
