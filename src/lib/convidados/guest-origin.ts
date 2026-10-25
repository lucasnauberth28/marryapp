// Convidado que só apareceu porque comprou um presente.
// Quem presenteia sem estar na lista é cadastrado para o casal saber quem mandou o quê, mas
// NÃO responde ao convite: fica com resposta pendente e com este grupo, e por isso não entra
// nas contas de confirmados, de quem falta responder nem nos lembretes em massa.
// Quando o casal troca o grupo (ou a pessoa responde ao convite), ela passa a valer como convidada.

export const CATEGORIA_SO_PRESENTE = "Só presenteou";

type ComoConfirmacao = "PENDING" | "CONFIRMED" | "DECLINED";

/** Dados de um convidado criado apenas por causa de um presente. */
export function padroesDoConvidadoSoPresente() {
  return { rsvpStatus: "PENDING" as const, category: CATEGORIA_SO_PRESENTE };
}

/** Verdadeiro para quem só presenteou e ainda não respondeu ao convite. */
export function ehSoPresentePendente(guest: { rsvpStatus: ComoConfirmacao; category?: string | null }): boolean {
  return guest.rsvpStatus === "PENDING" && guest.category === CATEGORIA_SO_PRESENTE;
}

/** Filtro Prisma que deixa de fora os convidados que só presentearam (inclui category nulo). */
export const filtroSemSoPresente: { OR: Array<{ category: null } | { category: { not: string } }> } = {
  OR: [{ category: null }, { category: { not: CATEGORIA_SO_PRESENTE } }],
};
