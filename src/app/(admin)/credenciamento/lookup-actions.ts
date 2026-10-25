"use server";

import prisma from "@/lib/prisma";
import { exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";
import { recusaDeModulo } from "@/lib/casamento/wedding-plan";

import { ERROS } from "@/lib/mensagens-de-erro";
// Consultas só de leitura da portaria: nada é gravado aqui (a entrada é registrada por checkInGuest).

export interface InformacoesDoConvidadoNaEntrada {
  id: string;
  name: string;
  /** Pessoas do convite: o convidado e os acompanhantes (confirmados, ou os permitidos se ainda não respondeu). */
  people: number;
  table: string | null;
  note: string | null;
  alreadyIn: boolean;
}

type LinhaDoConvidado = {
  id: string;
  name: string;
  rsvpStatus: "PENDING" | "CONFIRMED" | "DECLINED";
  confirmedCompanions: number;
  allowedCompanions: number;
  dietaryRestrictions: string | null;
  companionsNames: string | null;
  isPresent: boolean;
  table: { name: string } | null;
};

function paraInformacoes(g: LinhaDoConvidado): InformacoesDoConvidadoNaEntrada {
  const companions = g.rsvpStatus === "CONFIRMED" ? g.confirmedCompanions : g.allowedCompanions;
  const note = [g.dietaryRestrictions, g.companionsNames ? `Acompanhantes: ${g.companionsNames}` : null].filter(Boolean).join(" · ");
  return { id: g.id, name: g.name, people: 1 + Math.max(0, companions || 0), table: g.table?.name ?? null, note: note || null, alreadyIn: g.isPresent };
}

const selecaoDaConsulta = {
  id: true,
  name: true,
  rsvpStatus: true,
  confirmedCompanions: true,
  allowedCompanions: true,
  dietaryRestrictions: true,
  companionsNames: true,
  isPresent: true,
  table: { select: { name: true } },
} as const;

/** Dados do convidado do QR Code lido, para a pessoa da portaria conferir antes de liberar a entrada. */
export async function buscarConvidadoParaEntrada(guestId: string): Promise<{ success: true; guest: InformacoesDoConvidadoNaEntrada } | { success: false; error: string }> {
  const { weddingId, session } = await exigirCasamentoParaLeitura("/credenciamento");
  const refusal = await recusaDeModulo({ weddingId, session }, "qrcode");
  if (refusal) return { success: false, error: refusal };
  if (typeof guestId !== "string" || !guestId) return { success: false, error: ERROS.convidadoNaoEncontrado };
  const guest = await prisma.guest.findFirst({ where: { id: guestId, weddingId }, select: selecaoDaConsulta });
  if (!guest) return { success: false, error: "Esse convite não é deste casamento." };
  return { success: true, guest: paraInformacoes(guest) };
}

/** Busca pelo nome, para quem esqueceu o QR Code. */
export async function pesquisarConvidadosParaEntrada(query: string): Promise<InformacoesDoConvidadoNaEntrada[]> {
  const { weddingId, session } = await exigirCasamentoParaLeitura("/credenciamento");
  const refusal = await recusaDeModulo({ weddingId, session }, "qrcode");
  if (refusal) return [];
  const q = typeof query === "string" ? query.trim().slice(0, 80) : "";
  if (q.length < 2) return [];
  const guests = await prisma.guest.findMany({
    where: { weddingId, name: { contains: q, mode: "insensitive" } },
    select: selecaoDaConsulta,
    orderBy: { name: "asc" },
    take: 8,
  });
  return guests.map(paraInformacoes);
}
