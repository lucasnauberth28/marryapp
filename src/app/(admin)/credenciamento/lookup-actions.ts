"use server";

import prisma from "@/lib/prisma";
import { requireWedding } from "@/lib/security/wedding-context";
import { moduleRefusal } from "@/lib/wedding-plan";

// Consultas só de leitura da portaria: nada é gravado aqui (a entrada é registrada por checkInGuest).

export interface CheckInGuestInfo {
  id: string;
  name: string;
  /** Pessoas do convite: o convidado e os acompanhantes (confirmados, ou os permitidos se ainda não respondeu). */
  people: number;
  table: string | null;
  note: string | null;
  alreadyIn: boolean;
}

type GuestRow = {
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

function toInfo(g: GuestRow): CheckInGuestInfo {
  const companions = g.rsvpStatus === "CONFIRMED" ? g.confirmedCompanions : g.allowedCompanions;
  const note = [g.dietaryRestrictions, g.companionsNames ? `Acompanhantes: ${g.companionsNames}` : null].filter(Boolean).join(" · ");
  return { id: g.id, name: g.name, people: 1 + Math.max(0, companions || 0), table: g.table?.name ?? null, note: note || null, alreadyIn: g.isPresent };
}

const select = {
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
export async function lookupGuestForCheckIn(guestId: string): Promise<{ success: true; guest: CheckInGuestInfo } | { success: false; error: string }> {
  const { weddingId, session } = await requireWedding("/credenciamento");
  const refusal = await moduleRefusal({ weddingId, session }, "qrcode");
  if (refusal) return { success: false, error: refusal };
  if (typeof guestId !== "string" || !guestId) return { success: false, error: "Convidado não encontrado." };
  const guest = await prisma.guest.findFirst({ where: { id: guestId, weddingId }, select });
  if (!guest) return { success: false, error: "Esse convite não é deste casamento." };
  return { success: true, guest: toInfo(guest) };
}

/** Busca pelo nome, para quem esqueceu o QR Code. */
export async function searchGuestsForCheckIn(query: string): Promise<CheckInGuestInfo[]> {
  const { weddingId, session } = await requireWedding("/credenciamento");
  const refusal = await moduleRefusal({ weddingId, session }, "qrcode");
  if (refusal) return [];
  const q = typeof query === "string" ? query.trim().slice(0, 80) : "";
  if (q.length < 2) return [];
  const guests = await prisma.guest.findMany({
    where: { weddingId, name: { contains: q, mode: "insensitive" } },
    select,
    orderBy: { name: "asc" },
    take: 8,
  });
  return guests.map(toInfo);
}
