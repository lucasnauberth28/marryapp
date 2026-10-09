import { Metadata } from "next";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { getTimelineEvents } from "@/actions/timeline-actions";
import { TimelineClient } from "./timeline-client";
import { PageHeader } from "@/components/admin/page-header";
import { getWeddingIdentity } from "@/lib/wedding";

export const metadata: Metadata = {
  title: "Cronograma do Evento",
  description: "Gerencie o cronograma do dia do casamento",
};

export default async function CronogramaPage() {
  await requireWeddingPage("/cronograma");
  const events = await getTimelineEvents();

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        className="mb-8"
        title="Cronograma do dia"
        description="Organize os horários do evento para fornecedores, assessoria e convidados."
      />

      <TimelineClient initialEvents={events} coupleNames={(await getWeddingIdentity()).coupleNames} />
    </div>
  );
}
