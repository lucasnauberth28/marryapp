import { Metadata } from "next";
import Link from "next/link";
import { QrCode } from "lucide-react";
import { GuestHeader } from "@/components/public/guest-header";
import { btn } from "@/components/landing/styles";
import { getIdentityForWedding, guestPageMetadata } from "@/lib/wedding";
import { getWeddingTimeline } from "@/lib/wedding-data";
import { requirePublicWedding } from "@/lib/wedding-redirect";
import { weddingSitePath } from "@/lib/wedding-links";
import { TimelinePublicClient } from "./timeline-public-client";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return guestPageMetadata(slug, "Cronograma do dia", "Acompanhe os horários do grande dia.");
}

// Lê o banco a cada acesso: nunca pré-renderizar no build (dados congelados e build dependente do banco)
export const dynamic = "force-dynamic";

const BRASILIA = "America/Sao_Paulo";

/** "2027-10-11" no fuso de Brasília: o dia do casamento, sem depender do fuso do servidor. */
function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BRASILIA, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** "Segunda-feira, 11 de outubro" */
function weekdayLabel(date: Date) {
  const text = new Intl.DateTimeFormat("pt-BR", { timeZone: BRASILIA, weekday: "long", day: "numeric", month: "long" }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default async function DiaDoEventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const wedding = await requirePublicWedding(slug);
  const [events, identity] = await Promise.all([getWeddingTimeline(wedding.id), getIdentityForWedding(wedding)]);
  const date = identity.weddingDate;

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-linho text-tinta">
      <GuestHeader slug={wedding.slug} initials={identity.initials} coupleNames={identity.coupleNames} current="dia-do-evento" title="Dia do casamento" />
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-8 px-4 py-8 sm:py-14">
        <TimelinePublicClient
          events={events.map((e) => ({ id: e.id, title: e.title, time: e.time, description: e.description }))}
          dayKey={date ? dayKey(date) : null}
          dateLabel={date ? weekdayLabel(date) : null}
        />

        <section aria-labelledby="ingresso-titulo" className="flex flex-col gap-3 rounded-[16px] border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)]">
          <div className="flex items-start gap-3">
            <QrCode aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ameixa" strokeWidth={1.75} />
            <div className="flex flex-col gap-1">
              <h2 id="ingresso-titulo" className="font-semibold leading-6">
                Seu ingresso de entrada
              </h2>
              <p className="text-sm leading-5 text-tinta-suave">
                O QR Code aparece quando você confirma a presença. Abra o convite com o seu WhatsApp para ver ou salvar o seu.
              </p>
            </div>
          </div>
          <Link href={weddingSitePath(wedding.slug, "rsvp")} className={`${btn.secondary} ${btn.block}`}>
            Abrir meu convite
          </Link>
        </section>
      </div>
    </div>
  );
}
