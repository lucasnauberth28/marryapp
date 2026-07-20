import { Metadata } from "next";
import { verifyAdminSession } from "@/actions/auth-actions";
import { getTimelineEvents } from "@/actions/timeline-actions";
import { TimelineClient } from "./timeline-client";

export const metadata: Metadata = {
  title: "Cronograma do Evento | Lucas & Giovanna",
  description: "Gerencie o cronograma do dia do casamento",
};

export default async function CronogramaPage() {
  await verifyAdminSession();
  const events = await getTimelineEvents();

  return (
    <div className="flex-1 p-8 pt-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#8C6D45] tracking-tight font-serif italic">Cronograma do Dia</h1>
          <p className="text-zinc-500 mt-1">
            Organize minuto a minuto o dia do evento para fornecedores e assessoria.
          </p>
        </div>
      </div>

      <TimelineClient initialEvents={events} />
    </div>
  );
}
