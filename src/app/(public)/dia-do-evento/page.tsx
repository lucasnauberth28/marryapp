import { Metadata } from "next";
import { getTimelineEvents } from "@/actions/timeline-actions";
import { TimelinePublicClient } from "./timeline-public-client";

export const metadata: Metadata = {
  title: "Cronograma | Lucas & Giovanna",
  description: "Acompanhe o cronograma do dia do nosso casamento.",
};

export const revalidate = 60; // Cache de 1 minuto

export default async function DiaDoEventoPage() {
  const events = await getTimelineEvents();

  return (
    <div className="flex-1 flex flex-col items-center p-8 pt-12 w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-serif font-bold text-zinc-900 tracking-tight">O Grande Dia</h1>
        <p className="text-zinc-500 mt-2">
          Acompanhe os horários para não perder nenhum momento especial.
        </p>
      </div>

      <TimelinePublicClient events={events} />
    </div>
  );
}
