import { RsvpClient } from "./rsvp-client";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { isAfter, startOfDay } from "date-fns";
import { getIdentityForWedding, guestPageMetadata } from "@/lib/wedding";
import { getRsvpDeadline } from "@/lib/wedding-data";
import { requirePublicWedding } from "@/lib/wedding-redirect";

// Lê o banco a cada acesso: nunca pré-renderizar no build (dados congelados e build dependente do banco)
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return guestPageMetadata(slug, "Confirmar presença");
}

export default async function RsvpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const weddingRow = await requirePublicWedding(slug);
  const [rsvpDeadline, wedding] = await Promise.all([getRsvpDeadline(weddingRow.id), getIdentityForWedding(weddingRow)]);
  
  const isExpired = rsvpDeadline 
    ? isAfter(startOfDay(new Date()), startOfDay(new Date(rsvpDeadline))) 
    : false;

  if (isExpired) {
    return (
      <div className="flex-1 w-full bg-ivory flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg border-0 rounded-3xl overflow-hidden text-center p-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-areia rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-tinta-suave" />
          </div>
          <h2 className="text-2xl font-semibold text-tinta mb-2">Confirmações encerradas</h2>
          <p className="text-tinta-suave">
            O prazo para confirmar presença no casamento de {wedding.coupleNames} já passou.
            Se precisar de ajuda, fale diretamente com os noivos.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-ivory flex items-center justify-center p-4">
      <RsvpClient slug={weddingRow.slug} coupleNames={wedding.coupleNames} initials={wedding.initials} dateLabel={wedding.dateLabel} />
    </div>
  );
}
