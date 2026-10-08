import { Metadata } from "next";
import { getTimelineEvents } from "@/actions/timeline-actions";
import { guestPageMetadata } from "@/lib/wedding";
import { TimelinePublicClient } from "./timeline-public-client";

export async function generateMetadata(): Promise<Metadata> {
  return guestPageMetadata("Cronograma do dia", "Acompanhe os horários do grande dia.");
}

// Lê o banco a cada acesso: nunca pré-renderizar no build (dados congelados e build dependente do banco)
export const dynamic = "force-dynamic";

export default async function DiaDoEventoPage() {
  const events = await getTimelineEvents();

  return (
    <div className="flex-1 flex flex-col items-center p-8 pt-12 w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-display text-tinta tracking-tight">O Grande Dia</h1>
        <p className="text-tinta-suave mt-2">
          Acompanhe os horários para não perder nenhum momento especial.
        </p>
      </div>

      <TimelinePublicClient events={events} />
    </div>
  );
}
