export interface ConvidadoDaMesa {
  id: string;
  name: string;
  category?: string | null;
  allowedCompanions: number;
  rsvpStatus?: "PENDING" | "CONFIRMED" | "DECLINED";
  dietaryRestrictions?: string | null;
  parentGuest?: { name: string } | null;
}

export interface MesaComConvidados {
  id: string;
  name: string;
  capacity: number;
  guests: ConvidadoDaMesa[];
}

/** O convidado e os acompanhantes que ele pode levar. */
export const lugaresDe = (g: ConvidadoDaMesa) => 1 + (g.allowedCompanions || 0);

/** Identificador da área "Sem mesa" ao arrastar. */
export const SEM_MESA = "unassigned";
