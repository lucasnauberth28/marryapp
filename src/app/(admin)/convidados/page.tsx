import { Metadata } from "next";
import { getGuests } from "@/actions/guest-actions";
import { GuestsClient } from "./guests-client";
import prisma from "@/lib/prisma";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { weddingHasModule } from "@/lib/wedding-plan";

export const metadata: Metadata = {
  title: "Convidados",
  description: "Gerencie a lista de convidados do casamento",
};

export const dynamic = "force-dynamic";

const deadlineFormat = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function ConvidadosPage() {
  const { session, weddingId } = await requireWeddingPage("/convidados");

  // Só leitura: o prazo de confirmação definido em Configurações, se houver
  const [guests, settings, canRemind] = await Promise.all([
    getGuests(),
    prisma.systemSettings.findUnique({ where: { weddingId }, select: { rsvpDeadline: true } }),
    weddingHasModule({ weddingId, session }, "whatsapp"),
  ]);

  return (
    <GuestsClient
      initialGuests={guests}
      deadlineLabel={settings?.rsvpDeadline ? deadlineFormat.format(settings.rsvpDeadline) : null}
      canRemind={canRemind}
    />
  );
}
