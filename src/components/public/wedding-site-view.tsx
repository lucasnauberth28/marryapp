"use client";

import { useState, useTransition, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Gift,
  Hotel,
  MapPin,
  Menu,
  MessageSquare,
  Music,
  Phone,
  Scissors,
  Bus,
  Shirt,
  Tag,
  ExternalLink,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { btn, overline } from "@/components/landing/styles";
import { createGuestBookEntry } from "@/actions/site-builder-actions";
import { brandThemeStyle, getCoupleInitials } from "@/lib/wedding-format";
import { weddingSitePath } from "@/lib/wedding-links";
import { toast } from "sonner";
import { Reveal } from "@/components/motion/reveal";
import { UserImage } from "@/components/ui/user-image";
import { WeddingCountdown, weddingInstant } from "@/components/public/wedding-site-countdown";

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

/** Recados mostrados antes do "Ver todos". */
const GUESTBOOK_PREVIEW = 6;

function parsePalette(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c)) : [];
  } catch {
    return [];
  }
}

/** "Ana & Rafael", "Ana e Rafael" ou "Ana + Rafael" -> ["Ana", "Rafael"]; qualquer outro texto fica inteiro. */
function splitNames(raw: string): [string, string] | null {
  const parts = raw.split(/\s+(?:&|\+|e)\s+/i);
  return parts.length === 2 && parts[0] && parts[1] ? [parts[0], parts[1]] : null;
}

/** Nomes com o "&" em itálico na cor de destaque. */
function CoupleNames({ names, ampClassName = "text-ameixa" }: { names: string; ampClassName?: string }) {
  const pair = splitNames(names);
  if (!pair) return <>{names}</>;
  return (
    <>
      {pair[0]} <em className={`italic ${ampClassName}`}>&amp;</em> {pair[1]}
    </>
  );
}

/** "16:30" -> "16h30"; "16:00" -> "16h". Outro formato fica como foi escrito. */
function formatTime(raw?: string | null): string | null {
  const t = raw?.trim();
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return t;
  const hours = String(Number(m[1]));
  return m[2] === "00" ? `${hours}h` : `${hours}h${m[2]}`;
}

/** O dia do casamento é gravado ao meio-dia UTC: lê pelos campos UTC para o servidor e o navegador concordarem. */
function weddingDay(raw?: Date | string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12);
}

type Tone = "papel" | "linho" | "areia";

/** Cartão do design: papel, borda linha e raio de 16px. Dentro de faixa papel, usa o linho. */
const card = "rounded-2xl border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)] group-data-[tone=papel]/band:bg-linho";

const h2Class = "font-display text-[34px] font-normal leading-10 tracking-[-0.015em] text-tinta text-balance md:text-5xl md:leading-[54px]";

/** Faixa de seção do site: conteúdo de até 1120px, 48px de respiro no celular e 96px no computador. */
function Band({
  id,
  tone,
  compact = false,
  children,
}: {
  id?: string;
  tone: Tone;
  compact?: boolean;
  children: ReactNode;
}) {
  const bg = tone === "papel" ? "border-y border-linha bg-papel" : tone === "areia" ? "bg-areia" : "";
  return (
    <section id={id} data-tone={tone} className={`group/band ${bg}`}>
      <Reveal className={`mx-auto flex max-w-[1120px] flex-col gap-6 px-4 md:gap-8 md:px-6 ${compact ? "py-12 md:py-16" : "py-12 md:py-24"}`}>
        {children}
      </Reveal>
    </section>
  );
}

function Heading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex max-w-[560px] flex-col gap-3">
      <p className={overline}>{eyebrow}</p>
      <h2 className={h2Class}>{title}</h2>
      {children && <p className="text-base leading-6 text-tinta-suave">{children}</p>}
    </div>
  );
}

/** Foto em arco 3:4 (ou outra proporção). O pai define a largura. */
function ArchPhoto({
  src,
  alt,
  sizes,
  ratio = "aspect-[3/4]",
  priority,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  ratio?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`arch relative ${ratio} overflow-hidden bg-areia ${className}`}>
      <UserImage src={src} alt={alt} sizes={sizes} priority={priority} className="object-cover" />
    </div>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAllEntries, setShowAllEntries] = useState(false);
  // Sem recados, o formulário já aparece aberto: é o convite para escrever o primeiro.
  const [formOpen, setFormOpen] = useState(guestbookEntries.length === 0);

  const coupleNames = s.title?.trim() || "Nosso Casamento";
  const initials = getCoupleInitials(coupleNames);
  const day = weddingDay(s.weddingDate);
  const dateLabel = day ? format(day, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : null;
  const weekdayLabel = day ? format(day, "EEEE, d 'de' MMMM", { locale: ptBR }) : null;
  const deadlineDay = weddingDay(rsvpDeadline);
  const deadlineLabel = deadlineDay ? format(deadlineDay, "d 'de' MMMM", { locale: ptBR }) : null;
  const countdownTarget = s.weddingDate ? weddingInstant(new Date(s.weddingDate), s.ceremonyTime) : null;
  const palette = parsePalette(s.dressCodePalette);
  const accent = brandThemeStyle(s.themeColor);
  // O design usa a ameixa como destaque; no site do casal, o destaque é a cor que os noivos escolheram.
  const themeStyle = {
    ...accent,
    "--color-ameixa": accent["--color-brand"],
    "--color-ameixa-hover": accent["--color-brand-600"],
    "--color-ameixa-suave": accent["--color-brand-100"],
  } as CSSProperties;

  const address = s.locationAddress?.trim() || "";
  const locationName = s.locationName?.trim() || "";
  const mapsUrl = s.locationMapUrl || (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null);
  const wazeUrl = s.wazeUrl || (address ? `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes` : null);
  const uberUrl = s.uberUrl || (address ? `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(address)}` : null);

  // Foto da capa; sem ela, a foto do casal ocupa o arco (e não se repete em "Nossa história").
  const coverUrl = s.heroImageUrl || s.couplePhotoUrl || null;
  const storyCouplePhoto = s.heroImageUrl ? s.couplePhotoUrl || null : null;

  const showStory = s.showStory !== false && (storyItems.length > 0 || !!storyCouplePhoto || !!s.welcomeMessage?.trim());
  const showLocation = s.showLocation !== false && (!!locationName || !!address);
  const showDress = s.showDressCode !== false && (!!s.dressCodeTitle || !!s.dressCodeDesc);
  const showTips = s.showTips !== false && tips.length > 0;
  const showRsvp = s.showRsvp !== false;
  const showMusic = s.showMusic !== false && !!s.spotifyPlaylistUrl;
  const showGuestbook = s.showGuestbook !== false;
  const showGifts = s.showGifts !== false && gifts.length > 0;
  const showGiftLink = s.showGifts !== false;

  // As faixas alternam papel e linho na ordem em que aparecem; o mural fecha em areia.
  const bands = [
    showStory && "historia",
    (showLocation || showDress) && "cerimonia",
    showTips && "dicas",
    showGifts && "presentes",
    showRsvp && "rsvp",
    showMusic && "musica",
  ].filter(Boolean) as string[];
  const toneOf = (id: string): Tone => (bands.indexOf(id) % 2 === 0 ? "papel" : "linho");

  const navLinks = [
    showStory && { href: "#historia", label: "Nossa história" },
    showLocation && { href: "#cerimonia", label: "Cerimônia" },
    !showLocation && showDress && { href: "#cerimonia", label: "Traje" },
    showTips && { href: "#dicas", label: "Dicas" },
    showGifts && { href: "#presentes", label: "Presentes" },
    showGuestbook && { href: "#recados", label: "Recados" },
  ].filter(Boolean) as { href: string; label: string }[];

  const rsvpHref = weddingSitePath(slug, "rsvp");
  const giftsHref = weddingSitePath(slug, "presentes");

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

  // Menu do celular: fecha ao escolher uma seção ou com Esc
  const menuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setMenuOpen(false);
  };

  const visibleEntries = showAllEntries ? entries : entries.slice(0, GUESTBOOK_PREVIEW);

  // Fotos em arco da história: a do casal e as das cenas, no máximo duas; as demais ficam na linha do tempo.
  const storyArches = [
    storyCouplePhoto ? { src: storyCouplePhoto, alt: `Foto de ${coupleNames}`, itemId: null as string | null } : null,
    ...storyItems.filter((i) => i.imageUrl).map((i) => ({ src: i.imageUrl as string, alt: i.title, itemId: i.id as string | null })),
  ]
    .filter((a): a is { src: string; alt: string; itemId: string | null } => a !== null)
    .slice(0, 2);
  const archItemIds = new Set(storyArches.map((a) => a.itemId));

  // Texto da linha de data e local, logo abaixo dos nomes
  const whenWhere =
    dateLabel && locationName
      ? `${dateLabel} · ${locationName}`
      : dateLabel
        ? dateLabel
        : locationName
          ? `Data em breve · ${locationName}`
          : "Em breve: data e local";

  const ceremonyTime = formatTime(s.ceremonyTime);
  const receptionTime = formatTime(s.receptionTime);

  return (
    <div style={themeStyle} className="min-h-screen overflow-x-clip bg-linho font-sans text-tinta antialiased selection:bg-ameixa/20">
      {/* CABEÇALHO: no celular fica no topo ao rolar; as seções vão para um menu */}
      <header
        onKeyDown={menuKeyDown}
        className={`z-30 border-b border-linha bg-linho ${preview ? "relative" : "sticky top-0 lg:relative"}`}
      >
        <div className="mx-auto flex min-h-[60px] max-w-[1120px] items-center justify-between gap-x-8 gap-y-3 py-2 pl-4 pr-2 lg:flex-wrap md:px-6 lg:py-4">
          <a href="#inicio" className="flex min-h-11 items-center font-display text-[22px] leading-8 text-tinta no-underline md:text-2xl" aria-label={`${coupleNames}, início`} {...linkProps}>
            <InitialsText initials={initials} />
          </a>
          {navLinks.length > 0 && (
            <nav aria-label="Seções" className="hidden flex-wrap gap-x-6 gap-y-2 font-medium lg:flex">
              {navLinks.map((l) => (
                <a key={l.href + l.label} href={l.href} className="rounded-md py-2 text-tinta-suave no-underline hover:text-ameixa" {...linkProps}>
                  {l.label}
                </a>
              ))}
            </nav>
          )}
          {showRsvp && (
            <Link href={rsvpHref} className={`${btn.primary} ${btn.sm} max-lg:hidden`} {...linkProps}>
              Confirmar presença
            </Link>
          )}
          {navLinks.length > 0 && (
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="menu-secoes"
              aria-label={menuOpen ? "Fechar seções" : "Abrir seções"}
              className="grid size-11 place-items-center rounded-xl text-tinta hover:bg-areia lg:hidden"
            >
              {menuOpen ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
            </button>
          )}
        </div>
        {menuOpen && navLinks.length > 0 && (
          <nav id="menu-secoes" aria-label="Seções" className="absolute inset-x-0 top-full border-b border-linha bg-papel px-2 py-2 shadow-[var(--shadow-aceito-2)] lg:hidden">
            <ul>
              {navLinks.map((l) => (
                <li key={l.href + l.label}>
                  <a
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-12 items-center rounded-xl px-3 font-medium text-tinta no-underline hover:bg-areia"
                    {...(preview ? linkProps : {})}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {/* CAPA */}
      <section id="inicio" className="mx-auto flex max-w-[1120px] flex-col items-center gap-5 px-4 pb-12 pt-8 text-center md:gap-8 md:px-6 md:pb-24 md:pt-16">
        <div className="arch relative aspect-[3/4] w-[260px] max-w-[80%] bg-areia outline outline-1 outline-offset-[6px] outline-champanhe md:w-[360px] md:outline-offset-8">
          {coverUrl ? (
            <div className="arch absolute inset-0 overflow-hidden">
              <UserImage
                src={coverUrl}
                alt={`Foto de ${coupleNames}`}
                sizes="(min-width: 768px) 360px, 260px"
                priority
                className="hero-settle object-cover"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-ameixa">
              <span className="block h-px w-12 bg-champanhe" aria-hidden="true" />
              <span className="font-display text-6xl leading-none md:text-7xl" aria-hidden="true">
                <InitialsText initials={initials} />
              </span>
              <span className="block h-px w-12 bg-champanhe" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex max-w-full flex-col items-center gap-3 pt-2 md:pt-0">
          {s.subtitle?.trim() && <p className={overline}>{s.subtitle.trim()}</p>}
          <h1 className="m-0 max-w-full font-display text-[52px] font-normal leading-[54px] tracking-[-0.02em] text-tinta text-balance md:[font-size:clamp(56px,8vw,96px)] md:leading-none">
            <CoupleNames names={coupleNames} />
          </h1>
          <p className="m-0 text-[17px] leading-7 text-tinta-suave md:text-xl">{whenWhere}</p>
        </div>

        {countdownTarget !== null && <WeddingCountdown target={countdownTarget} />}

        {(showRsvp || showGiftLink) && (
          <div className="flex flex-wrap justify-center gap-3">
            {showRsvp && (
              <Link href={rsvpHref} className={btn.primary} {...linkProps}>
                Confirmar presença
              </Link>
            )}
            {showGiftLink && (
              <Link href={giftsHref} className={btn.secondary} {...linkProps}>
                Ver lista de presentes
              </Link>
            )}
          </div>
        )}
        {showRsvp && deadlineLabel && <p className="m-0 text-sm text-tinta-suave">Pedimos que confirme até {deadlineLabel}.</p>}
      </section>

      {/* NOSSA HISTÓRIA */}
      {showStory && (
        <Band id="historia" tone={toneOf("historia")}>
          <div
            className={`grid items-center gap-6 md:gap-x-16 md:gap-y-4 ${
              storyArches.length > 0 ? "md:grid-cols-2" : "mx-auto w-full max-w-[720px]"
            }`}
          >
            <div className="flex flex-col gap-3 md:self-end">
              <p className={overline}>Nossa história</p>
              <h2 className={h2Class}>Como tudo começou</h2>
            </div>

            {storyArches.length > 0 && (
              <div className="flex items-end justify-center gap-3 md:row-span-2 md:row-start-1 md:gap-6">
                {storyArches.map((a, i) => (
                  <ArchPhoto
                    key={a.src}
                    src={a.src}
                    alt={a.alt}
                    ratio={i === 0 ? "aspect-[2/3]" : "aspect-[3/4]"}
                    sizes="(min-width: 768px) 200px, 45vw"
                    className={`min-w-0 flex-1 ${i === 0 ? "md:w-[200px] md:flex-none" : "md:w-[150px] md:flex-none"}`}
                  />
                ))}
              </div>
            )}

            <div className="flex min-w-0 flex-col gap-4 md:self-start">
              {s.welcomeMessage?.trim() && (
                <p className="m-0 max-w-[60ch] whitespace-pre-line text-[17px] leading-[26px] text-tinta-suave md:text-lg md:leading-7">
                  {s.welcomeMessage.trim()}
                </p>
              )}
              {storyItems.length > 0 && (
                <ol className="m-0 mt-2 flex list-none flex-col gap-5 border-l border-champanhe p-0 pl-6">
                  {storyItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-4">
                      {item.imageUrl && !archItemIds.has(item.id) && (
                        <ArchPhoto src={item.imageUrl} alt={item.title} sizes="88px" className="w-[72px] shrink-0 md:w-[88px]" />
                      )}
                      <div className="min-w-0">
                        {item.dateLabel && <p className="m-0 font-display text-xl text-ameixa">{item.dateLabel}</p>}
                        <h3 className="m-0 font-display text-[22px] font-medium leading-7 text-tinta">{item.title}</h3>
                        <p className="m-0 mt-1 whitespace-pre-line text-tinta-suave">{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </Band>
      )}

      {/* CERIMÔNIA, RECEPÇÃO E TRAJE */}
      {(showLocation || showDress) && (
        <Band id="cerimonia" tone={toneOf("cerimonia")}>
          {showLocation && (
            <>
              <div className="flex flex-col items-start gap-3 md:items-center md:text-center">
                <p className={overline}>O grande dia</p>
                <h2 className={h2Class}>{weekdayLabel ? weekdayLabel.charAt(0).toUpperCase() + weekdayLabel.slice(1) : "Onde vamos celebrar"}</h2>
              </div>

              <article className={`${card} grid gap-6 md:grid-cols-[1.4fr_1fr] md:gap-12`}>
                <div className="flex min-w-0 flex-col gap-3">
                  <p className={overline}>Local</p>
                  {locationName && <h3 className="m-0 font-display text-2xl font-medium leading-[30px] text-tinta md:text-[26px] md:leading-8">{locationName}</h3>}
                  {address && (
                    <p className="m-0 flex gap-2 text-tinta-suave">
                      <MapPin className="mt-1 size-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0">{address}</span>
                    </p>
                  )}
                  {(mapsUrl || wazeUrl || uberUrl) && (
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap [&>*:last-child:nth-child(odd)]:max-sm:col-span-2">
                      {mapsUrl && (
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={`${btn.secondary} ${btn.sm}`} {...linkProps}>
                          <span className="sm:hidden">Google Maps</span>
                          <span className="hidden sm:inline">Abrir no Google Maps</span>
                        </a>
                      )}
                      {wazeUrl && (
                        <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className={`${btn.secondary} ${btn.sm} sm:border-transparent sm:bg-transparent`} {...linkProps}>
                          <span className="sm:hidden">Waze</span>
                          <span className="hidden sm:inline">Abrir no Waze</span>
                        </a>
                      )}
                      {uberUrl && (
                        <a href={uberUrl} target="_blank" rel="noopener noreferrer" className={`${btn.secondary} ${btn.sm} sm:border-transparent sm:bg-transparent`} {...linkProps}>
                          <span className="sm:hidden">Uber</span>
                          <span className="hidden sm:inline">Chamar um Uber</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {(ceremonyTime || receptionTime) && (
                  <dl className="m-0 flex flex-col justify-center gap-4 border-t border-linha pt-6 md:border-l md:border-t-0 md:pl-12 md:pt-0">
                    {ceremonyTime && (
                      <div>
                        <dt className={overline}>Cerimônia</dt>
                        <dd className="m-0 font-display text-4xl leading-[44px] text-ameixa tabular-nums">{ceremonyTime}</dd>
                      </div>
                    )}
                    {receptionTime && (
                      <div>
                        <dt className={overline}>Recepção</dt>
                        <dd className="m-0 font-display text-4xl leading-[44px] text-ameixa tabular-nums">{receptionTime}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </article>
            </>
          )}

          {showDress && (
            <div className="flex flex-wrap items-center gap-x-12 gap-y-4 rounded-2xl bg-areia p-6">
              <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
                <p className={overline}>Traje</p>
                {s.dressCodeTitle && <p className="m-0 text-[17px] leading-7 text-tinta md:text-lg">{s.dressCodeTitle}</p>}
                {s.dressCodeDesc && <p className="m-0 whitespace-pre-line text-tinta-suave">{s.dressCodeDesc}</p>}
                {palette.length > 0 && (
                  <ul className="m-0 mt-3 flex list-none flex-wrap items-center gap-3 p-0" aria-label="Cores sugeridas">
                    {palette.map((color) => (
                      <li
                        key={color}
                        className="size-10 rounded-full border-2 border-papel shadow-[var(--shadow-aceito-1)] ring-1 ring-linha"
                        style={{ backgroundColor: color }}
                        title={color}
                        aria-label={`Cor ${color}`}
                      />
                    ))}
                  </ul>
                )}
              </div>
              {showTips && (
                <a href="#dicas" className={btn.quiet} {...linkProps}>
                  Ver dicas para o dia
                </a>
              )}
            </div>
          )}
        </Band>
      )}

      {/* DICAS AOS CONVIDADOS */}
      {showTips && (
        <Band id="dicas" tone={toneOf("dicas")}>
          <Heading eyebrow="Para os convidados" title="Dicas para aproveitar o dia">
            Hospedagem, beleza e transporte que indicamos.
          </Heading>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6 p-0">
            {tips.map((tip) => {
              const cat = TIP_CATEGORIES[tip.category] ?? { label: "Dica", icon: MapPin };
              const Icon = cat.icon;
              return (
                <li key={tip.id} className={`${card} flex flex-col gap-3`}>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ameixa-suave text-ameixa">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className={overline}>{cat.label}</p>
                      <h3 className="m-0 font-display text-[22px] font-medium leading-7 text-tinta">{tip.title}</h3>
                    </div>
                  </div>
                  {tip.description && <p className="m-0 whitespace-pre-line text-tinta-suave">{tip.description}</p>}
                  {(tip.address || tip.phone) && (
                    <div className="flex flex-col gap-1 text-sm text-tinta-suave">
                      {tip.address && (
                        <span className="flex items-start gap-2">
                          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {tip.address}
                        </span>
                      )}
                      {tip.phone && (
                        <span className="flex items-center gap-2">
                          <Phone className="size-4 shrink-0" aria-hidden="true" /> {tip.phone}
                        </span>
                      )}
                    </div>
                  )}
                  {(tip.discountCode || tip.linkUrl) && (
                    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                      {tip.discountCode && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-ameixa/25 bg-ameixa-suave px-3 py-1 text-xs font-semibold text-ameixa">
                          <Tag className="size-3.5" aria-hidden="true" /> Cupom {tip.discountCode}
                        </span>
                      )}
                      {tip.linkUrl && (
                        <a
                          href={tip.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center gap-1 font-semibold text-ameixa hover:underline"
                          {...linkProps}
                        >
                          Ver site <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Band>
      )}

      {/* LISTA DE PRESENTES */}
      {showGifts && (
        <Band id="presentes" tone={toneOf("presentes")}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Heading eyebrow="Lista de presentes" title="Um carinho para a vida nova">
              Sua presença é o nosso maior presente. Se quiser contribuir, escolha um item.
            </Heading>
            <Link href={giftsHref} className={`${btn.secondary} max-md:hidden`} {...linkProps}>
              Ver todos os presentes
            </Link>
          </div>
          {/* Celular: carrossel de cards de 160px; computador: grade de até 4 por linha */}
          <ul className="-mr-4 m-0 flex list-none snap-x snap-mandatory gap-3 overflow-x-auto p-0 pb-1 pr-4 md:mr-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] md:gap-6 md:overflow-visible md:pr-0">
            {gifts.slice(0, 6).map((gift, i) => (
              <li key={gift.id} className={`w-40 shrink-0 snap-start md:w-auto ${i >= 4 ? "md:hidden" : ""}`}>
                <Link href={`/checkout/${gift.id}`} className="group/gift flex flex-col gap-1.5 text-tinta no-underline md:gap-2" {...linkProps}>
                  <span className="zoom-media relative block aspect-square overflow-hidden rounded-2xl bg-areia">
                    {gift.imageUrl ? (
                      <UserImage src={gift.imageUrl} alt="" sizes="(min-width: 768px) 260px, 160px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-ameixa/60">
                        <Gift className="size-8" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <strong className="line-clamp-2 text-[15px] font-semibold leading-5 md:text-base md:leading-6">{gift.title}</strong>
                  <span className="text-sm text-tinta-suave tabular-nums md:text-base">{brl.format(gift.amount / 100)}</span>
                  <span className="text-sm font-semibold text-ameixa group-hover/gift:underline">Presentear</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href={giftsHref} className={`${btn.secondary} ${btn.block} md:hidden`} {...linkProps}>
            Ver todos os presentes
          </Link>
        </Band>
      )}

      {/* CONFIRMAÇÃO DE PRESENÇA */}
      {showRsvp && (
        <section id="confirmar" data-tone={toneOf("rsvp")} className={`group/band ${toneOf("rsvp") === "papel" ? "border-y border-linha bg-papel" : ""}`}>
          <Reveal variant="scale" className="mx-auto flex max-w-[1120px] justify-center px-4 py-12 md:px-6 md:py-24">
            <div className="relative w-full max-w-[560px] rounded-2xl border border-linha bg-papel px-6 py-10 text-center shadow-[var(--shadow-aceito-2)] md:px-8 md:py-12">
              <span className="pointer-events-none absolute inset-2 rounded-[10px] border border-champanhe" aria-hidden="true" />
              <div className="relative flex flex-col items-center gap-2">
                <p className={overline}>Confirmação de presença</p>
                <h2 className="m-0 mt-2 font-display text-[34px] font-normal leading-10 tracking-[-0.015em] text-balance md:text-[40px] md:leading-[46px]">
                  Contamos com você?
                </h2>
                <p className="m-0 mb-4 max-w-[40ch] text-tinta-suave">
                  {deadlineLabel
                    ? `Confirme sua presença até ${deadlineLabel}. Digite seu nome como está no convite e leva menos de um minuto.`
                    : "Digite seu nome como está no convite. Leva menos de um minuto."}
                </p>
                <Link href={rsvpHref} className={`${btn.primary} ${btn.block}`} {...linkProps}>
                  Confirmar presença
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* PLAYLIST */}
      {showMusic && (
        <Band tone={toneOf("musica")} compact>
          <div className={`${card} flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left`}>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-ameixa-suave text-ameixa">
              <Music className="size-6" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h2 className="m-0 font-display text-2xl font-medium leading-8 text-tinta">A trilha sonora da festa</h2>
              <p className="m-0 text-tinta-suave">Ouça a nossa playlist e entre no clima.</p>
            </div>
            <a href={s.spotifyPlaylistUrl!} target="_blank" rel="noopener noreferrer" className={btn.secondary} {...linkProps}>
              Ouvir playlist <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </div>
        </Band>
      )}

      {/* MURAL DE RECADOS */}
      {showGuestbook && (
        <Band id="recados" tone="areia">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-3">
              <p className={overline}>Mural de recados</p>
              <h2 className="m-0 font-display text-[34px] font-normal leading-10 text-tinta text-balance md:text-[40px] md:leading-[46px]">
                Deixe um recado para os noivos
              </h2>
            </div>
            {!formOpen && (
              <button
                type="button"
                onClick={() => {
                  setFormOpen(true);
                  // O formulário acabou de aparecer: leva o foco para o primeiro campo
                  requestAnimationFrame(() => document.getElementById("guestbook-name")?.focus());
                }}
                aria-expanded={formOpen}
                aria-controls="form-recado"
                disabled={preview}
                className={`${btn.secondary} max-md:w-full`}
              >
                Escrever um recado
              </button>
            )}
          </div>

          {formOpen && (
            <form id="form-recado" onSubmit={handleSendGuestbook} className="flex flex-col gap-4 rounded-2xl border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)] md:max-w-[560px]">
              <div className="flex flex-col gap-2">
                <label htmlFor="guestbook-name" className="text-sm font-semibold text-tinta">
                  Seu nome
                </label>
                <Input
                  id="guestbook-name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ex.: Rodrigo e Carol"
                  maxLength={80}
                  disabled={preview}
                  autoComplete="name"
                  className="h-11 rounded-xl border-linha-forte bg-papel"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="guestbook-message" className="text-sm font-semibold text-tinta">
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
                  className="rounded-xl border-linha-forte bg-papel"
                />
              </div>
              <button type="submit" disabled={isPending || preview} className={btn.primary}>
                {isPending ? "Enviando..." : "Enviar recado"}
              </button>
            </form>
          )}

          {entries.length === 0 ? (
            formOpen ? null : (
            <p className="m-0 flex items-center gap-3 text-tinta-suave">
              <MessageSquare className="size-5 shrink-0" aria-hidden="true" />
              Seja o primeiro a deixar um recado.
            </p>
            )
          ) : (
            <>
              <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-6 p-0">
                {visibleEntries.map((item) => (
                  <li key={item.id} className="contents">
                    <figure className="m-0 flex flex-col gap-3 rounded-2xl border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)]">
                      <blockquote className="m-0 whitespace-pre-line break-words font-display text-xl italic leading-7 text-tinta">{item.message}</blockquote>
                      <figcaption className="text-sm text-tinta-suave">
                        {item.authorName}
                        <span aria-hidden="true"> · </span>
                        <time dateTime={new Date(item.createdAt).toISOString()}>{format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}</time>
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
              {entries.length > GUESTBOOK_PREVIEW && (
                <button type="button" onClick={() => setShowAllEntries((v) => !v)} className={`${btn.secondary} self-center`}>
                  {showAllEntries ? "Mostrar menos recados" : `Ver todos os ${entries.length} recados`}
                </button>
              )}
            </>
          )}
        </Band>
      )}

      <footer className="flex flex-col items-center gap-3 px-4 py-12 text-center">
        <p className="m-0 font-display text-[34px] leading-10 text-tinta">
          <InitialsText initials={initials} />
        </p>
        <p className="m-0 text-sm text-tinta-suave">{dateLabel ? `${dateLabel} · ` : ""}Feito com Aceito</p>
      </footer>

      {/* Celular: o botão principal sempre à mão (sticky: o pai da rota tem transform, que quebraria o fixed) */}
      {!preview && (showRsvp || showGiftLink) && (
        <div className="sticky bottom-0 z-30 flex gap-2 border-t border-linha bg-papel px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[var(--shadow-aceito-2)] lg:hidden">
          {showRsvp ? (
            <Link href={rsvpHref} className={`${btn.primary} flex-1`}>
              Confirmar presença
            </Link>
          ) : (
            <Link href={giftsHref} className={`${btn.primary} flex-1`}>
              Lista de presentes
            </Link>
          )}
          {showRsvp && showGiftLink && (
            <Link href={giftsHref} aria-label="Lista de presentes" className={`${btn.secondary} px-3.5`}>
              <Gift className="size-6" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/** "L&G" -> L & G, com o "&" em itálico. Uma inicial só (ou o coração) fica como está. */
function InitialsText({ initials }: { initials: string }) {
  const [a, b] = initials.split("&");
  if (!b) return <>{initials}</>;
  return (
    <>
      {a} <em className="italic">&amp;</em> {b}
    </>
  );
}
