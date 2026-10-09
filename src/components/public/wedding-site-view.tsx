"use client";

import { useMemo, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Heart,
  Calendar,
  Clock,
  MapPin,
  Gift,
  Car,
  Navigation,
  Map as MapIcon,
  Shirt,
  Hotel,
  Scissors,
  Bus,
  MessageSquare,
  Music,
  Send,
  ArrowRight,
  ExternalLink,
  Phone,
  Tag,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createGuestBookEntry } from "@/actions/site-builder-actions";
import { brandThemeStyle, daysUntil } from "@/lib/wedding-format";
import { weddingSitePath } from "@/lib/wedding-links";
import { toast } from "sonner";
import { Reveal, RevealWords } from "@/components/motion/reveal";

export interface WeddingSiteSettings {
  title?: string | null;
  subtitle?: string | null;
  weddingDate?: Date | string | null;
  ceremonyTime?: string | null;
  receptionTime?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  locationMapUrl?: string | null;
  wazeUrl?: string | null;
  uberUrl?: string | null;
  themeColor?: string | null;
  heroImageUrl?: string | null;
  couplePhotoUrl?: string | null;
  dressCodeTitle?: string | null;
  dressCodeDesc?: string | null;
  dressCodePalette?: string | null;
  spotifyPlaylistUrl?: string | null;
  welcomeMessage?: string | null;
  showStory?: boolean;
  showLocation?: boolean;
  showDressCode?: boolean;
  showTips?: boolean;
  showGifts?: boolean;
  showRsvp?: boolean;
  showGuestbook?: boolean;
  showMusic?: boolean;
}

interface StoryItem {
  id: string;
  title: string;
  dateLabel?: string | null;
  description: string;
  imageUrl?: string | null;
}

interface Tip {
  id: string;
  category: string;
  title: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  linkUrl?: string | null;
  discountCode?: string | null;
}

interface GuestbookEntry {
  id: string;
  authorName: string;
  message: string;
  createdAt: Date | string;
}

interface SiteGift {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  imageUrl?: string | null;
}

interface WeddingSiteViewProps {
  /** Endereço do casamento (/casamento/<slug>): links de RSVP, presentes e o mural usam este casamento. */
  slug: string;
  settings: WeddingSiteSettings | null;
  storyItems: StoryItem[];
  tips: Tip[];
  guestbookEntries: GuestbookEntry[];
  gifts: SiteGift[];
  rsvpDeadline?: Date | string | null;
  /** Prévia no editor: desativa links e formulários. */
  preview?: boolean;
}

const TIP_CATEGORIES: Record<string, { label: string; icon: typeof Hotel }> = {
  HOTEL: { label: "Hospedagem", icon: Hotel },
  SALON: { label: "Beleza", icon: Scissors },
  TRANSFER: { label: "Transporte", icon: Bus },
  DRESS: { label: "Trajes", icon: Shirt },
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function parsePalette(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c)) : [];
  } catch {
    return [];
  }
}

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <Reveal className="mx-auto mb-14 max-w-2xl text-center">
      <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl leading-[1.1] text-tinta text-balance sm:text-5xl">{title}</h2>
      <span className="mx-auto mt-5 block h-px w-12 bg-brand/40" aria-hidden="true" />
      {children && <div className="mt-5 font-sans text-base leading-relaxed text-tinta-suave">{children}</div>}
    </Reveal>
  );
}

export function WeddingSiteView({
  slug,
  settings,
  storyItems,
  tips,
  guestbookEntries,
  gifts,
  rsvpDeadline,
  preview = false,
}: WeddingSiteViewProps) {
  const s = settings ?? {};
  const [entries, setEntries] = useState(guestbookEntries);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const coupleNames = s.title?.trim() || "Nosso Casamento";
  const weddingDate = s.weddingDate ? new Date(s.weddingDate) : null;
  const dateLabel = weddingDate ? format(weddingDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : null;
  const deadlineLabel = rsvpDeadline ? format(new Date(rsvpDeadline), "d 'de' MMMM", { locale: ptBR }) : null;
  const daysToGo = useMemo(() => (weddingDate ? daysUntil(weddingDate) : null), [weddingDate]);
  const palette = parsePalette(s.dressCodePalette);
  const themeStyle = brandThemeStyle(s.themeColor) as CSSProperties;

  const address = s.locationAddress?.trim() || "";
  const mapsUrl = s.locationMapUrl || (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null);
  const wazeUrl = s.wazeUrl || (address ? `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes` : null);
  const uberUrl = s.uberUrl || (address ? `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(address)}` : null);

  const showStory = s.showStory !== false && (storyItems.length > 0 || !!s.couplePhotoUrl || !!s.welcomeMessage);
  const showLocation = s.showLocation !== false && (!!s.locationName || !!address);
  const showDress = s.showDressCode !== false && (!!s.dressCodeTitle || !!s.dressCodeDesc);
  const showTips = s.showTips !== false && tips.length > 0;
  const showRsvp = s.showRsvp !== false;
  const showMusic = s.showMusic !== false && !!s.spotifyPlaylistUrl;
  const showGuestbook = s.showGuestbook !== false;
  const showGifts = s.showGifts !== false && gifts.length > 0;
  const hasHeroImage = !!s.heroImageUrl;

  const handleSendGuestbook = (e: React.FormEvent) => {
    e.preventDefault();
    if (preview) return;
    if (!authorName.trim() || !message.trim()) {
      toast.error("Preencha seu nome e a mensagem.");
      return;
    }

    startTransition(async () => {
      const res = await createGuestBookEntry(slug, { authorName, message });
      if (res.success && res.entry) {
        setEntries((prev) => [res.entry as GuestbookEntry, ...prev]);
        setAuthorName("");
        setMessage("");
        toast.success("Recado enviado. Obrigado pelo carinho!");
      } else {
        toast.error(res.error || "Não foi possível enviar o recado.");
      }
    });
  };

  // Na prévia do editor, links não navegam
  const linkProps = preview ? { tabIndex: -1, "aria-disabled": true, onClick: (e: React.MouseEvent) => e.preventDefault() } : {};

  return (
    <div style={themeStyle} className="min-h-screen overflow-x-clip bg-ivory font-sans text-tinta antialiased selection:bg-brand/20">
      {/* CAPA */}
      <section
        className={`relative flex min-h-[92svh] flex-col items-center justify-center overflow-hidden border-b border-linha px-6 py-24 text-center ${
          hasHeroImage ? "text-white" : ""
        }`}
      >
        {hasHeroImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- imagem enviada pelo casal, de domínio variável */}
            <img src={s.heroImageUrl!} alt="" className="hero-settle absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/60" aria-hidden="true" />
          </>
        ) : (
          <div
            className="absolute inset-0 bg-[radial-gradient(var(--color-brand-300)_1px,transparent_1px)] [background-size:24px_24px] opacity-30"
            aria-hidden="true"
          />
        )}

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
          <Reveal as="p" variant="fade" className={`mb-5 text-xs font-semibold uppercase tracking-[0.3em] sm:text-sm ${hasHeroImage ? "text-white" : "text-brand-600"}`}>
            Convidamos você para celebrar
          </Reveal>

          <h1 className={`font-display text-6xl italic leading-[0.95] tracking-[-0.02em] text-balance sm:text-8xl md:text-9xl ${hasHeroImage ? "text-white" : "text-tinta"}`}>
            <RevealWords text={coupleNames} baseDelay={150} step={110} />
          </h1>

          {s.subtitle && (
            <Reveal as="p" delay={450} className={`mt-6 text-base font-medium sm:text-xl ${hasHeroImage ? "text-white" : "text-tinta-suave"}`}>
              {s.subtitle}
            </Reveal>
          )}

          {(dateLabel || s.ceremonyTime || s.locationName) && (
            <Reveal
              as="ul"
              delay={550}
              className={`mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-3xl border px-6 py-3 text-sm font-semibold ${
                hasHeroImage ? "border-white/25 bg-black/25 text-white backdrop-blur" : "border-linha/80 bg-papel/80 text-tinta-suave backdrop-blur"
              }`}
            >
              {dateLabel && (
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" aria-hidden="true" /> {dateLabel}
                </li>
              )}
              {s.ceremonyTime && (
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4" aria-hidden="true" /> Cerimônia às {s.ceremonyTime}
                </li>
              )}
              {s.locationName && (
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" aria-hidden="true" /> {s.locationName}
                </li>
              )}
            </Reveal>
          )}

          {daysToGo !== null && daysToGo >= 0 && (
            <Reveal as="p" variant="fade" delay={650} className={`mt-7 font-display text-2xl italic ${hasHeroImage ? "text-white" : "text-brand-600"}`}>
              <span suppressHydrationWarning>{daysToGo === 0 ? "É hoje!" : daysToGo === 1 ? "Falta 1 dia" : `Faltam ${daysToGo} dias`}</span>
            </Reveal>
          )}

          <Reveal delay={750} className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {showRsvp && (
              <Button asChild className="lift h-12 rounded-full bg-brand px-7 text-sm font-semibold text-white shadow-lg hover:bg-brand-600">
                <Link href={weddingSitePath(slug, "rsvp")} {...linkProps}>
                  <CalendarCheck className="h-4 w-4" aria-hidden="true" /> Confirmar presença
                </Link>
              </Button>
            )}
            {s.showGifts !== false && (
              <Button
                asChild
                variant="outline"
                className={`h-12 rounded-full px-7 text-sm font-semibold ${
                  hasHeroImage ? "border-white/60 bg-papel/10 text-white hover:bg-papel/20 hover:text-white" : "border-linha text-tinta hover:bg-papel"
                }`}
              >
                <Link href={weddingSitePath(slug, "presentes")} {...linkProps}>
                  <Gift className="h-4 w-4" aria-hidden="true" /> Lista de presentes
                </Link>
              </Button>
            )}
          </Reveal>
        </div>

        <span
          className={`absolute bottom-8 left-1/2 hidden h-12 w-px -translate-x-1/2 overflow-hidden sm:block ${hasHeroImage ? "bg-white/30" : "bg-linha"}`}
          aria-hidden="true"
        >
          <span className={`scroll-cue block h-1/2 w-full ${hasHeroImage ? "bg-white" : "bg-brand"}`} />
        </span>
      </section>

      {/* NOSSA HISTÓRIA */}
      {showStory && (
        <section className="mx-auto max-w-5xl px-6 py-24">
          <SectionHeading eyebrow="Nossa história" title="Como tudo começou">
            {s.welcomeMessage}
          </SectionHeading>

          {s.couplePhotoUrl && (
            <Reveal variant="arch" className="arch mx-auto mb-16 aspect-[4/5] w-full max-w-md overflow-hidden shadow-[var(--shadow-aceito-2)]">
              {/* eslint-disable-next-line @next/next/no-img-element -- imagem enviada pelo casal */}
              <img src={s.couplePhotoUrl} alt={`Foto de ${coupleNames}`} className="h-full w-full object-cover" />
            </Reveal>
          )}

          {storyItems.length > 0 && (
            <ol className="flex flex-col gap-6">
              {storyItems.map((item, i) => (
                <Reveal
                  as="li"
                  key={item.id}
                  variant={i % 2 === 0 ? "left" : "right"}
                  className={`flex flex-col items-center gap-6 rounded-3xl border border-linha bg-papel p-6 shadow-sm md:p-8 ${
                    i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {item.imageUrl && (
                    <div className="zoom-media h-56 w-full shrink-0 overflow-hidden rounded-2xl md:h-48 md:w-56">
                      {/* eslint-disable-next-line @next/next/no-img-element -- imagem enviada pelo casal */}
                      <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {item.dateLabel && <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{item.dateLabel}</p>}
                    <h3 className="mt-1 font-display text-3xl text-tinta">{item.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-tinta-suave">{item.description}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* LOCAL E HORÁRIOS */}
      {showLocation && (
        <section className="border-y border-linha bg-papel py-24">
          <div className="mx-auto max-w-5xl px-6">
            <SectionHeading eyebrow="Local e horários" title="Onde vamos celebrar" />

            <Reveal variant="scale" className="grid gap-6 rounded-3xl border border-linha/80 bg-ivory p-6 sm:p-8 md:grid-cols-[1.4fr_1fr]">
              <div className="min-w-0">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <MapPin className="h-6 w-6" aria-hidden="true" />
                </div>
                {s.locationName && <h3 className="font-display text-3xl text-tinta">{s.locationName}</h3>}
                {address && <p className="mt-2 text-sm text-tinta-suave">{address}</p>}

                {(s.ceremonyTime || s.receptionTime) && (
                  <dl className="mt-6 grid gap-2 border-t border-linha/80 pt-5 text-sm">
                    {s.ceremonyTime && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-tinta-suave">Cerimônia</dt>
                        <dd className="font-semibold tabular-nums text-tinta">{s.ceremonyTime}</dd>
                      </div>
                    )}
                    {s.receptionTime && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-tinta-suave">Recepção</dt>
                        <dd className="font-semibold tabular-nums text-tinta">{s.receptionTime}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>

              {(mapsUrl || wazeUrl || uberUrl) && (
                <div className="flex flex-col justify-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-tinta-suave">Como chegar</p>
                  {mapsUrl && (
                    <Button asChild variant="outline" className="h-12 justify-start gap-3 rounded-2xl border-linha bg-papel font-semibold">
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" {...linkProps}>
                        <MapIcon className="h-4 w-4 text-brand" aria-hidden="true" /> Ver no Google Maps
                      </a>
                    </Button>
                  )}
                  {wazeUrl && (
                    <Button asChild variant="outline" className="h-12 justify-start gap-3 rounded-2xl border-linha bg-papel font-semibold">
                      <a href={wazeUrl} target="_blank" rel="noopener noreferrer" {...linkProps}>
                        <Navigation className="h-4 w-4 text-brand" aria-hidden="true" /> Abrir no Waze
                      </a>
                    </Button>
                  )}
                  {uberUrl && (
                    <Button asChild variant="outline" className="h-12 justify-start gap-3 rounded-2xl border-linha bg-papel font-semibold">
                      <a href={uberUrl} target="_blank" rel="noopener noreferrer" {...linkProps}>
                        <Car className="h-4 w-4 text-brand" aria-hidden="true" /> Chamar um Uber
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </Reveal>
          </div>
        </section>
      )}

      {/* TRAJE */}
      {showDress && (
        <section className="mx-auto max-w-5xl px-6 py-24">
          <SectionHeading eyebrow="Traje" title={s.dressCodeTitle || "Traje"}>
            {s.dressCodeDesc}
          </SectionHeading>
          {palette.length > 0 && (
            <Reveal className="text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-tinta-suave">Cores sugeridas</p>
              <ul className="flex flex-wrap items-center justify-center gap-3">
                {palette.map((color) => (
                  <li
                    key={color}
                    className="h-10 w-10 rounded-full border-2 border-white shadow-md ring-1 ring-linha"
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`Cor ${color}`}
                  />
                ))}
              </ul>
            </Reveal>
          )}
        </section>
      )}

      {/* DICAS AOS CONVIDADOS */}
      {showTips && (
        <section className="border-y border-linha bg-papel py-24">
          <div className="mx-auto max-w-5xl px-6">
            <SectionHeading eyebrow="Para os convidados" title="Dicas para aproveitar o dia">
              Hospedagem, beleza e transporte que indicamos.
            </SectionHeading>
            <ul className="grid gap-5 sm:grid-cols-2">
              {tips.map((tip, i) => {
                const cat = TIP_CATEGORIES[tip.category] ?? { label: "Dica", icon: MapPin };
                const Icon = cat.icon;
                return (
                  <Reveal as="li" key={tip.id} delay={(i % 2) * 100} className="lift flex flex-col gap-3 rounded-3xl border border-linha bg-ivory p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{cat.label}</p>
                        <h3 className="truncate font-display text-2xl text-tinta">{tip.title}</h3>
                      </div>
                    </div>
                    {tip.description && <p className="text-sm text-tinta-suave">{tip.description}</p>}
                    <div className="flex flex-col gap-1 text-sm text-tinta-suave">
                      {tip.address && (
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-tinta-suave" aria-hidden="true" /> {tip.address}
                        </span>
                      )}
                      {tip.phone && (
                        <span className="flex items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0 text-tinta-suave" aria-hidden="true" /> {tip.phone}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
                      {tip.discountCode && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                          <Tag className="h-3.5 w-3.5" aria-hidden="true" /> Cupom {tip.discountCode}
                        </span>
                      )}
                      {tip.linkUrl && (
                        <a
                          href={tip.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"
                          {...linkProps}
                        >
                          Ver site <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* CONFIRMAÇÃO DE PRESENÇA */}
      {showRsvp && (
        <section className="px-6 py-20">
          <Reveal
            variant="scale"
            className="relative mx-auto flex max-w-3xl flex-col items-center gap-4 overflow-hidden rounded-3xl bg-brand px-6 py-14 text-center text-white shadow-lg"
          >
            <span className="arch pointer-events-none absolute -bottom-24 -left-16 h-64 w-48 border border-white/20" aria-hidden="true" />
            <span className="arch pointer-events-none absolute -right-12 -top-10 h-56 w-40 border border-white/15" aria-hidden="true" />
            <CalendarCheck className="relative h-8 w-8" aria-hidden="true" />
            <h2 className="relative font-display text-4xl italic text-balance sm:text-5xl">Você vem?</h2>
            <p className="relative max-w-md text-base text-white">
              {deadlineLabel
                ? `Confirme sua presença até ${deadlineLabel}. Leva menos de um minuto.`
                : "Confirme sua presença para organizarmos tudo com carinho. Leva menos de um minuto."}
            </p>
            <Button asChild className="lift relative mt-2 h-12 rounded-full bg-papel px-8 font-semibold text-brand-600 hover:bg-papel/90">
              <Link href={weddingSitePath(slug, "rsvp")} {...linkProps}>
                Confirmar presença
              </Link>
            </Button>
          </Reveal>
        </section>
      )}

      {/* PLAYLIST */}
      {showMusic && (
        <section className="mx-auto max-w-3xl px-6 pb-20">
          <Reveal className="flex flex-col items-center gap-4 rounded-3xl border border-linha bg-papel p-8 text-center sm:flex-row sm:text-left">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Music className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h2 className="font-display text-2xl text-tinta">A trilha sonora da festa</h2>
              <p className="text-sm text-tinta-suave">Ouça a nossa playlist e entre no clima.</p>
            </div>
            <Button asChild variant="outline" className="rounded-full border-linha font-semibold">
              <a href={s.spotifyPlaylistUrl!} target="_blank" rel="noopener noreferrer" {...linkProps}>
                Ouvir playlist <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </Reveal>
        </section>
      )}

      {/* MURAL DE RECADOS */}
      {showGuestbook && (
        <section className="border-t border-linha bg-papel py-24">
          <div className="mx-auto max-w-5xl px-6">
            <SectionHeading eyebrow="Mural de recados" title="Deixe uma mensagem">
              Os noivos vão guardar cada palavra.
            </SectionHeading>

            <div className="grid items-start gap-8 md:grid-cols-2">
              <form onSubmit={handleSendGuestbook} data-reveal="left" suppressHydrationWarning className="flex flex-col gap-4 rounded-3xl border border-linha bg-ivory p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="guestbook-name" className="text-sm font-semibold text-tinta-suave">
                    Seu nome
                  </label>
                  <Input
                    id="guestbook-name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ex.: Rodrigo e Carol"
                    maxLength={80}
                    disabled={preview}
                    className="h-12 rounded-2xl border-linha bg-papel"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="guestbook-message" className="text-sm font-semibold text-tinta-suave">
                    Mensagem
                  </label>
                  <Textarea
                    id="guestbook-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Desejamos toda a felicidade do mundo..."
                    rows={4}
                    maxLength={1000}
                    disabled={preview}
                    className="rounded-2xl border-linha bg-papel"
                  />
                </div>
                <Button type="submit" disabled={isPending || preview} className="h-12 gap-2 rounded-full bg-brand font-semibold text-white hover:bg-brand-600">
                  <Send className="h-4 w-4" aria-hidden="true" /> Enviar recado
                </Button>
              </form>

              <ul data-reveal="right" suppressHydrationWarning data-lenis-prevent className="flex max-h-[460px] flex-col gap-3 overflow-y-auto pr-1">
                {entries.length === 0 ? (
                  <li className="rounded-3xl border border-linha bg-ivory p-8 text-center text-sm text-tinta-suave">
                    <MessageSquare className="mx-auto mb-2 h-8 w-8 text-tinta-suave" aria-hidden="true" />
                    Seja o primeiro a deixar um recado.
                  </li>
                ) : (
                  entries.map((item) => (
                    <li key={item.id} className="rounded-2xl border border-linha bg-ivory p-5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-tinta">{item.authorName}</span>
                        <time className="text-xs text-tinta-suave" dateTime={new Date(item.createdAt).toISOString()}>
                          {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </time>
                      </div>
                      <p className="font-display text-base italic leading-relaxed text-tinta-suave">“{item.message}”</p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* PRESENTES */}
      {showGifts && (
        <section className="mx-auto max-w-6xl px-6 py-24">
          <SectionHeading eyebrow="Lista de presentes" title="Se quiser nos presentear">
            Sua presença é o nosso maior presente. Se quiser contribuir, escolha um item.
          </SectionHeading>

          <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {gifts.slice(0, 6).map((gift, i) => (
              <Reveal
                as="li"
                key={gift.id}
                delay={(i % 3) * 90}
                className="lift flex flex-col overflow-hidden rounded-3xl border border-linha bg-papel p-5 shadow-sm"
              >
                {gift.imageUrl && (
                  <div className="zoom-media mb-4 h-44 w-full overflow-hidden rounded-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element -- imagem enviada pelo casal */}
                    <img src={gift.imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <h3 className="line-clamp-1 font-display text-xl text-tinta">{gift.title}</h3>
                {gift.description && <p className="mt-1 line-clamp-2 text-sm text-tinta-suave">{gift.description}</p>}
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-linha pt-4">
                  <span className="text-base font-semibold tabular-nums text-tinta">{brl.format(gift.amount / 100)}</span>
                  <Button asChild className="h-9 rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-600">
                    <Link href={`/checkout/${gift.id}`} {...linkProps}>
                      Presentear
                    </Link>
                  </Button>
                </div>
              </Reveal>
            ))}
          </ul>

          <div className="mt-12 text-center">
            <Button asChild variant="outline" className="h-12 gap-2 rounded-full border-linha px-8 font-semibold">
              <Link href={weddingSitePath(slug, "presentes")} {...linkProps}>
                Ver a lista completa <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      <footer className="border-t border-linha bg-papel py-10 text-center text-sm text-tinta-suave">
        <p className="mb-1 flex items-center justify-center gap-2 font-display text-xl italic text-tinta">
          <Heart className="h-4 w-4 fill-brand text-brand" aria-hidden="true" /> {coupleNames}
        </p>
        <p>{dateLabel ? `${dateLabel} · ` : ""}Feito com Aceito</p>
      </footer>
    </div>
  );
}
