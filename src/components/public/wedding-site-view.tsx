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
import { toast } from "sonner";

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
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-900 text-balance sm:text-4xl">{title}</h2>
      {children && <div className="mt-3 font-sans text-sm leading-relaxed text-stone-600">{children}</div>}
    </div>
  );
}

export function WeddingSiteView({
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
      const res = await createGuestBookEntry({ authorName, message });
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
    <div style={themeStyle} className="min-h-screen bg-ivory font-sans text-stone-900 antialiased selection:bg-brand/20">
      {/* CAPA */}
      <section
        className={`relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden border-b border-stone-200 px-6 py-24 text-center ${
          hasHeroImage ? "text-white" : ""
        }`}
      >
        {hasHeroImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- imagem enviada pelo casal, de domínio variável */}
            <img src={s.heroImageUrl!} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/60" aria-hidden="true" />
          </>
        ) : (
          <div
            className="absolute inset-0 bg-[radial-gradient(var(--color-brand-300)_1px,transparent_1px)] [background-size:24px_24px] opacity-30"
            aria-hidden="true"
          />
        )}

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
          <p className={`mb-4 text-xs font-semibold uppercase tracking-[0.3em] sm:text-sm ${hasHeroImage ? "text-white/90" : "text-brand-600"}`}>
            Convidamos você para celebrar
          </p>

          <h1 className={`font-serif text-5xl font-semibold leading-none tracking-tight text-balance sm:text-7xl md:text-8xl ${hasHeroImage ? "text-white" : "text-stone-900"}`}>
            {coupleNames}
          </h1>

          {s.subtitle && (
            <p className={`mt-5 text-base font-medium sm:text-xl ${hasHeroImage ? "text-white/90" : "text-stone-600"}`}>{s.subtitle}</p>
          )}

          {(dateLabel || s.ceremonyTime || s.locationName) && (
            <ul
              className={`mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-3xl border px-6 py-3 text-sm font-semibold ${
                hasHeroImage ? "border-white/25 bg-black/25 text-white backdrop-blur" : "border-stone-200/80 bg-white/80 text-stone-700 backdrop-blur"
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
            </ul>
          )}

          {daysToGo !== null && daysToGo >= 0 && (
            <p className={`mt-6 font-serif text-2xl italic ${hasHeroImage ? "text-white" : "text-brand-600"}`} suppressHydrationWarning>
              {daysToGo === 0 ? "É hoje!" : daysToGo === 1 ? "Falta 1 dia" : `Faltam ${daysToGo} dias`}
            </p>
          )}

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {showRsvp && (
              <Button asChild className="h-12 rounded-full bg-brand px-7 text-sm font-semibold text-white shadow-lg hover:bg-brand-600">
                <Link href="/rsvp" {...linkProps}>
                  <CalendarCheck className="h-4 w-4" aria-hidden="true" /> Confirmar presença
                </Link>
              </Button>
            )}
            {s.showGifts !== false && (
              <Button
                asChild
                variant="outline"
                className={`h-12 rounded-full px-7 text-sm font-semibold ${
                  hasHeroImage ? "border-white/60 bg-white/10 text-white hover:bg-white/20 hover:text-white" : "border-stone-300 text-stone-800 hover:bg-white"
                }`}
              >
                <Link href="/presentes" {...linkProps}>
                  <Gift className="h-4 w-4" aria-hidden="true" /> Lista de presentes
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* NOSSA HISTÓRIA */}
      {showStory && (
        <section className="mx-auto max-w-5xl px-6 py-24">
          <SectionHeading eyebrow="Nossa história" title="Como tudo começou">
            {s.welcomeMessage}
          </SectionHeading>

          {s.couplePhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- imagem enviada pelo casal
            <img
              src={s.couplePhotoUrl}
              alt={`Foto de ${coupleNames}`}
              className="mx-auto mb-12 aspect-[4/3] w-full max-w-2xl rounded-3xl object-cover shadow-md"
            />
          )}

          {storyItems.length > 0 && (
            <ol className="flex flex-col gap-6">
              {storyItems.map((item) => (
                <li key={item.id} className="flex flex-col items-center gap-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:flex-row md:p-8">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- imagem enviada pelo casal
                    <img src={item.imageUrl} alt="" className="h-48 w-full shrink-0 rounded-2xl object-cover md:w-56" />
                  )}
                  <div className="min-w-0 flex-1">
                    {item.dateLabel && <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{item.dateLabel}</p>}
                    <h3 className="mt-1 font-serif text-2xl font-semibold text-stone-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* LOCAL E HORÁRIOS */}
      {showLocation && (
        <section className="border-y border-stone-200 bg-white py-24">
          <div className="mx-auto max-w-5xl px-6">
            <SectionHeading eyebrow="Local e horários" title="Onde vamos celebrar" />

            <div className="grid gap-6 rounded-3xl border border-stone-200/80 bg-ivory p-6 sm:p-8 md:grid-cols-[1.4fr_1fr]">
              <div className="min-w-0">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <MapPin className="h-6 w-6" aria-hidden="true" />
                </div>
                {s.locationName && <h3 className="font-serif text-2xl font-semibold text-stone-900">{s.locationName}</h3>}
                {address && <p className="mt-2 text-sm text-stone-600">{address}</p>}

                {(s.ceremonyTime || s.receptionTime) && (
                  <dl className="mt-6 grid gap-2 border-t border-stone-200/80 pt-5 text-sm">
                    {s.ceremonyTime && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-stone-600">Cerimônia</dt>
                        <dd className="font-semibold tabular-nums text-stone-900">{s.ceremonyTime}</dd>
                      </div>
                    )}
                    {s.receptionTime && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-stone-600">Recepção</dt>
                        <dd className="font-semibold tabular-nums text-stone-900">{s.receptionTime}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>

              {(mapsUrl || wazeUrl || uberUrl) && (
                <div className="flex flex-col justify-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Como chegar</p>
                  {mapsUrl && (
                    <Button asChild variant="outline" className="h-12 justify-start gap-3 rounded-2xl border-stone-300 bg-white font-semibold">
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" {...linkProps}>
                        <MapIcon className="h-4 w-4 text-brand" aria-hidden="true" /> Ver no Google Maps
                      </a>
                    </Button>
                  )}
                  {wazeUrl && (
                    <Button asChild variant="outline" className="h-12 justify-start gap-3 rounded-2xl border-stone-300 bg-white font-semibold">
                      <a href={wazeUrl} target="_blank" rel="noopener noreferrer" {...linkProps}>
                        <Navigation className="h-4 w-4 text-brand" aria-hidden="true" /> Abrir no Waze
                      </a>
                    </Button>
                  )}
                  {uberUrl && (
                    <Button asChild variant="outline" className="h-12 justify-start gap-3 rounded-2xl border-stone-300 bg-white font-semibold">
                      <a href={uberUrl} target="_blank" rel="noopener noreferrer" {...linkProps}>
                        <Car className="h-4 w-4 text-brand" aria-hidden="true" /> Chamar um Uber
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
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
            <div className="text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">Cores sugeridas</p>
              <ul className="flex flex-wrap items-center justify-center gap-3">
                {palette.map((color) => (
                  <li
                    key={color}
                    className="h-10 w-10 rounded-full border-2 border-white shadow-md ring-1 ring-stone-200"
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`Cor ${color}`}
                  />
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* DICAS AOS CONVIDADOS */}
      {showTips && (
        <section className="border-y border-stone-200 bg-white py-24">
          <div className="mx-auto max-w-5xl px-6">
            <SectionHeading eyebrow="Para os convidados" title="Dicas para aproveitar o dia">
              Hospedagem, beleza e transporte que indicamos.
            </SectionHeading>
            <ul className="grid gap-5 sm:grid-cols-2">
              {tips.map((tip) => {
                const cat = TIP_CATEGORIES[tip.category] ?? { label: "Dica", icon: MapPin };
                const Icon = cat.icon;
                return (
                  <li key={tip.id} className="flex flex-col gap-3 rounded-3xl border border-stone-200 bg-ivory p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{cat.label}</p>
                        <h3 className="truncate font-serif text-xl font-semibold text-stone-900">{tip.title}</h3>
                      </div>
                    </div>
                    {tip.description && <p className="text-sm text-stone-600">{tip.description}</p>}
                    <div className="flex flex-col gap-1 text-sm text-stone-600">
                      {tip.address && (
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-stone-500" aria-hidden="true" /> {tip.address}
                        </span>
                      )}
                      {tip.phone && (
                        <span className="flex items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0 text-stone-500" aria-hidden="true" /> {tip.phone}
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
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* CONFIRMAÇÃO DE PRESENÇA */}
      {showRsvp && (
        <section className="px-6 py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-3xl bg-brand px-6 py-12 text-center text-white shadow-lg">
            <CalendarCheck className="h-8 w-8" aria-hidden="true" />
            <h2 className="font-serif text-3xl font-semibold text-balance sm:text-4xl">Você vem?</h2>
            <p className="max-w-md text-sm text-white/90">
              {deadlineLabel
                ? `Confirme sua presença até ${deadlineLabel}. Leva menos de um minuto.`
                : "Confirme sua presença para organizarmos tudo com carinho. Leva menos de um minuto."}
            </p>
            <Button asChild className="mt-2 h-12 rounded-full bg-white px-8 font-semibold text-brand-600 hover:bg-white/90">
              <Link href="/rsvp" {...linkProps}>
                Confirmar presença
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* PLAYLIST */}
      {showMusic && (
        <section className="mx-auto max-w-3xl px-6 pb-20">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-stone-200 bg-white p-8 text-center sm:flex-row sm:text-left">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Music className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h2 className="font-serif text-xl font-semibold text-stone-900">A trilha sonora da festa</h2>
              <p className="text-sm text-stone-600">Ouça a nossa playlist e entre no clima.</p>
            </div>
            <Button asChild variant="outline" className="rounded-full border-stone-300 font-semibold">
              <a href={s.spotifyPlaylistUrl!} target="_blank" rel="noopener noreferrer" {...linkProps}>
                Ouvir playlist <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </section>
      )}

      {/* MURAL DE RECADOS */}
      {showGuestbook && (
        <section className="border-t border-stone-200 bg-white py-24">
          <div className="mx-auto max-w-5xl px-6">
            <SectionHeading eyebrow="Mural de recados" title="Deixe uma mensagem">
              Os noivos vão guardar cada palavra.
            </SectionHeading>

            <div className="grid items-start gap-8 md:grid-cols-2">
              <form onSubmit={handleSendGuestbook} className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-ivory p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="guestbook-name" className="text-sm font-semibold text-stone-700">
                    Seu nome
                  </label>
                  <Input
                    id="guestbook-name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ex.: Rodrigo e Carol"
                    maxLength={80}
                    disabled={preview}
                    className="h-12 rounded-2xl border-stone-200 bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="guestbook-message" className="text-sm font-semibold text-stone-700">
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
                    className="rounded-2xl border-stone-200 bg-white"
                  />
                </div>
                <Button type="submit" disabled={isPending || preview} className="h-12 gap-2 rounded-full bg-brand font-semibold text-white hover:bg-brand-600">
                  <Send className="h-4 w-4" aria-hidden="true" /> Enviar recado
                </Button>
              </form>

              <ul className="flex max-h-[460px] flex-col gap-3 overflow-y-auto pr-1">
                {entries.length === 0 ? (
                  <li className="rounded-3xl border border-stone-200 bg-ivory p-8 text-center text-sm text-stone-600">
                    <MessageSquare className="mx-auto mb-2 h-8 w-8 text-stone-400" aria-hidden="true" />
                    Seja o primeiro a deixar um recado.
                  </li>
                ) : (
                  entries.map((item) => (
                    <li key={item.id} className="rounded-2xl border border-stone-200 bg-ivory p-5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-stone-900">{item.authorName}</span>
                        <time className="text-xs text-stone-500" dateTime={new Date(item.createdAt).toISOString()}>
                          {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </time>
                      </div>
                      <p className="font-serif text-base italic leading-relaxed text-stone-700">“{item.message}”</p>
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
            {gifts.slice(0, 6).map((gift) => (
              <li key={gift.id} className="flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                {gift.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- imagem enviada pelo casal
                  <img src={gift.imageUrl} alt="" className="mb-4 h-44 w-full rounded-2xl object-cover" />
                )}
                <h3 className="line-clamp-1 font-serif text-lg font-semibold text-stone-900">{gift.title}</h3>
                {gift.description && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{gift.description}</p>}
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
                  <span className="text-base font-semibold tabular-nums text-stone-900">{brl.format(gift.amount / 100)}</span>
                  <Button asChild className="h-9 rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-600">
                    <Link href={`/checkout/${gift.id}`} {...linkProps}>
                      Presentear
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-12 text-center">
            <Button asChild variant="outline" className="h-12 gap-2 rounded-full border-stone-300 px-8 font-semibold">
              <Link href="/presentes" {...linkProps}>
                Ver a lista completa <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      <footer className="border-t border-stone-200 bg-white py-10 text-center text-sm text-stone-500">
        <p className="mb-1 flex items-center justify-center gap-2 font-serif text-lg italic text-stone-700">
          <Heart className="h-4 w-4 fill-brand text-brand" aria-hidden="true" /> {coupleNames}
        </p>
        <p>{dateLabel ? `${dateLabel} · ` : ""}Feito com MarryApp</p>
      </footer>
    </div>
  );
}
