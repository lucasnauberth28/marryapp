import { Metadata } from "next";
import { guestPageMetadata } from "@/lib/wedding";
import { getWeddingTimeline } from "@/lib/wedding-data";
import { requirePublicWedding } from "@/lib/wedding-redirect";
import { TimelinePublicClient } from "./timeline-public-client";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return guestPageMetadata(slug, "Cronograma do dia", "Acompanhe os horários do grande dia.");
}

// Lê o banco a cada acesso: nunca pré-renderizar no build (dados congelados e build dependente do banco)
export const dynamic = "force-dynamic";

export default async function DiaDoEventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const wedding = await requirePublicWedding(slug);
  const events = await getWeddingTimeline(wedding.id);

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
