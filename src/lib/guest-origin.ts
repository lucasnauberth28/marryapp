// Convidado que só apareceu porque comprou um presente.
// Quem presenteia sem estar na lista é cadastrado para o casal saber quem mandou o quê, mas
// NÃO responde ao convite: fica com resposta pendente e com este grupo, e por isso não entra
// nas contas de confirmados, de quem falta responder nem nos lembretes em massa.
// Quando o casal troca o grupo (ou a pessoa responde ao convite), ela passa a valer como convidada.

export const GIFT_ONLY_CATEGORY = "Só presenteou";

type RsvpLike = "PENDING" | "CONFIRMED" | "DECLINED";

/** Dados de um convidado criado apenas por causa de um presente. */
export function giftOnlyGuestDefaults() {
  return { rsvpStatus: "PENDING" as const, category: GIFT_ONLY_CATEGORY };
}

/** Verdadeiro para quem só presenteou e ainda não respondeu ao convite. */
export function isGiftOnlyPending(guest: { rsvpStatus: RsvpLike; category?: string | null }): boolean {
  return guest.rsvpStatus === "PENDING" && guest.category === GIFT_ONLY_CATEGORY;
}

/** Filtro Prisma que deixa de fora os convidados que só presentearam (inclui category nulo). */
export const notGiftOnlyWhere: { OR: Array<{ category: null } | { category: { not: string } }> } = {
  OR: [{ category: null }, { category: { not: GIFT_ONLY_CATEGORY } }],
};
