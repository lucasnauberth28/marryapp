// Converte o que vem do banco no formato simples (textos e rótulos) que os componentes do navegador recebem.
import { formatarData, haQuantoTempo } from "@/lib/platform/format";
import { situacaoDoPrazo } from "@/lib/platform/support";
import type { listarSolicitacoesDeDados, listarIncidentes, listarChamados } from "@/lib/platform/queries/chamados";
import type { ItemDeSolicitacaoDeDados } from "../_components/data-requests";

export const PADRAO_DE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const anoMesDia = (d: Date | null) => (d ? new Date(d.getTime() - 3 * 3_600_000).toISOString().slice(0, 10) : "");

const dias = (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`;

function textoDoPrazo(due: ReturnType<typeof situacaoDoPrazo>) {
  if (due.kind === "overdue") return `Venceu há ${dias(due.days)}`;
  if (due.kind === "soon" || due.kind === "ok") return due.days === 0 ? "Vence hoje" : `Vence em ${dias(due.days)}`;
  return null;
}

export function itensDeSolicitacao(requests: Awaited<ReturnType<typeof listarSolicitacoesDeDados>>, now: Date): ItemDeSolicitacaoDeDados[] {
  return requests.map((r) => {
    const due = situacaoDoPrazo(r.dueAt, r.status, now);
    return {
      id: r.id,
      type: r.type,
      requesterName: r.requesterName,
      requesterEmail: r.requesterEmail,
      linked: r.userId !== null,
      status: r.status,
      receivedLabel: formatarData(r.receivedAt),
      dueLabel: formatarData(r.dueAt),
      dueText: textoDoPrazo(due),
      dueTone: due.kind === "overdue" || due.kind === "soon" ? "perigo" : due.kind === "ok" ? "neutro" : null,
      note: r.note,
    };
  });
}

/** Resumo dos pedidos de dados com prazo estourando ou perto de estourar (null se não há nenhum). */
export function resumoDosUrgentes(requests: Awaited<ReturnType<typeof listarSolicitacoesDeDados>>, now: Date) {
  const urgentes = requests.map((r) => ({ r, due: situacaoDoPrazo(r.dueAt, r.status, now) })).filter((x) => x.due.kind === "overdue" || x.due.kind === "soon");
  if (urgentes.length === 0) return null;
  const algumVencido = urgentes.some((x) => x.due.kind === "overdue");
  const n = urgentes.length;
  return algumVencido ? `${n} ${n === 1 ? "vencido ou perto de vencer" : "vencidos ou perto de vencer"}` : `${n} vence${n === 1 ? "" : "m"} em até 5 dias`;
}

export function linhasDeChamados(tickets: Awaited<ReturnType<typeof listarChamados>>, userId: string, now: Date) {
  return tickets.rows.map((t) => ({
    id: t.id,
    number: t.number,
    subject: t.subject,
    body: t.body,
    requesterName: t.requesterName,
    requesterEmail: t.requesterEmail,
    status: t.status,
    assigneeName: t.assigneeName,
    mine: t.assigneeId === userId,
    internalNote: t.internalNote,
    whenLabel: haQuantoTempo(t.createdAt, now),
    weddingId: t.weddingId,
    vendorId: t.vendorId,
  }));
}

export function linhasDeIncidentes(incidents: Awaited<ReturnType<typeof listarIncidentes>>) {
  return incidents.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    affected: i.affected,
    discoveredLabel: formatarData(i.discoveredAt),
    notifiedOn: anoMesDia(i.notifiedAt),
    notifiedWho: i.notifiedWho,
    open: i.status === "OPEN",
  }));
}
