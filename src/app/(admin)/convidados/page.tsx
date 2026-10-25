import { Metadata } from "next";
import { getGuests } from "@/actions/guest-actions";
import { GuestsClient } from "./guests-client";
import prisma from "@/lib/prisma";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { weddingHasModule } from "@/lib/wedding-plan";

import { formatarDataCivilLonga } from "@/lib/formatacao/data";
export const metadata: Metadata = {
  title: "Convidados",
  description: "Gerencie a lista de convidados do casamento",
};

export const dynamic = "force-dynamic";


// Filtros da lista que um link de fora pode abrir (ex.: a sugestão da Liz em "Ver convidados sem resposta")
const RESPOSTAS = { "sem-resposta": "PENDING", confirmados: "CONFIRMED", "nao-vao": "DECLINED" } as const;

export default async function ConvidadosPage({ searchParams }: { searchParams: Promise<{ resposta?: string }> }) {
  const { session, weddingId } = await requireWeddingPage("/convidados");
  const { resposta } = await searchParams;
  const initialFilter = RESPOSTAS[resposta as keyof typeof RESPOSTAS] ?? "all";

  // Só leitura: o prazo de confirmação definido em Configurações, se houver
  const [guests, settings, canRemind] = await Promise.all([
    getGuests(),
    prisma.systemSettings.findUnique({ where: { weddingId }, select: { rsvpDeadline: true } }),
    weddingHasModule({ weddingId, session }, "whatsapp"),
  ]);

  return (
    <GuestsClient
      initialGuests={guests}
      deadlineLabel={settings?.rsvpDeadline ? formatarDataCivilLonga(settings.rsvpDeadline) : null}
      canRemind={canRemind}
      initialFilter={initialFilter}
    />
  );
}
