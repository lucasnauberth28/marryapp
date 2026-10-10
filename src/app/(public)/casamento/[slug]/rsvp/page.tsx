import { RsvpClient } from "./rsvp-client";
import Link from "next/link";
import { Clock } from "lucide-react";
import { isAfter, startOfDay } from "date-fns";
import { btn } from "@/components/landing/styles";
import { Monogram } from "@/components/public/guest-header";
import { getIdentityForWedding, guestPageMetadata } from "@/lib/wedding";
import { getRsvpDeadline } from "@/lib/wedding-data";
import { requirePublicWedding } from "@/lib/wedding-redirect";
import { weddingSitePath } from "@/lib/wedding-links";

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

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-linho text-tinta">
      <header className="border-b border-linha">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-4 py-4 sm:px-6">
          <Link href={weddingSitePath(weddingRow.slug)} aria-label={`Site de ${wedding.coupleNames}`} className="no-underline">
            <Monogram initials={wedding.initials} />
          </Link>
          {wedding.shortDateLabel ? <span className="text-sm text-tinta-suave">{wedding.shortDateLabel}</span> : null}
        </div>
      </header>

      {isExpired ? (
        <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col gap-6 px-4 py-8 sm:py-14">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">Confirmação de presença</p>
            <h1 className="font-display text-[34px] font-normal leading-10 tracking-[-0.015em]">As confirmações foram encerradas</h1>
            <p className="text-tinta-suave">
              O prazo para confirmar presença no casamento de {wedding.coupleNames} já passou. Se precisar de ajuda, fale
              diretamente com os noivos.
            </p>
          </div>
          <p className="flex items-center gap-2 text-sm text-tinta-suave">
            <Clock aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Quem já respondeu não precisa fazer mais nada.
          </p>
          <Link href={weddingSitePath(weddingRow.slug)} className={btn.secondary}>
            Ver o site do casal
          </Link>
        </div>
      ) : (
        <RsvpClient slug={weddingRow.slug} coupleNames={wedding.coupleNames} dateLabel={wedding.dateLabel} locationName={wedding.locationName} />
      )}
    </div>
  );
}
