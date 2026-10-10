"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { btn, container } from "@/components/landing/styles";
import {
  Building2,
  Star,
  MapPin,
  Video,
  CheckCircle2,
  Check,
  ExternalLink,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Share2,
  Globe,
  Sparkles,
  Camera,
  Loader2,
  CalendarCheck,
  CalendarX,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { checkVendorAvailability, createVendorLead, type PublicVendor } from "@/actions/partner-vendor-actions";
import { toast } from "sonner";
import { LEAD_BUDGET_OPTIONS, parseGallery, parseRegions } from "@/app/(fornecedor)/_lib/vendor-panel";
import { UserImage } from "@/components/ui/user-image";
import { cn } from "@/lib/utils";

interface VendorDetailClientProps {
  vendor: PublicVendor;
  /** Hoje em Brasília ("AAAA-MM-DD"), mínimo da consulta de disponibilidade. */
  todayIso: string;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// Campos do design: 44px, borda forte, raio de 12px, texto de 16px.
const inputCls = "h-11 rounded-[12px] bg-papel text-base shadow-none";
const labelCls = "text-sm font-semibold leading-5 text-tinta";
const sectionTitle = "font-display text-2xl font-medium leading-8 text-tinta sm:text-[26px]";

/** Com menos de 5 fotos, as pequenas crescem para o mosaico não ficar com buraco. */
function mosaicCell(index: number, total: number) {
  if (index === 0) return "col-span-2 row-span-2 bg-salvia-suave";
  if (total === 2) return "col-span-2 row-span-2";
  if (total === 3) return "col-span-2";
  if (total === 4 && index === 3) return "col-span-2";
  return "";
}

/** "Ver disponibilidade": consulta só sim/não na agenda do fornecedor. */
function AvailabilityCheck({ vendorId, todayIso }: { vendorId: string; todayIso: string }) {
  const [date, setDate] = useState("");
  const [result, setResult] = useState<{ date: string; available: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!date) {
      setError("Escolha a data do casamento.");
      return;
    }
    startTransition(async () => {
      const res = await checkVendorAvailability(vendorId, date);
      if (res.success) setResult({ date, available: res.available });
      else setError(res.error);
    });
  };

  const dateLabel = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2" aria-describedby="disponibilidade-resultado">
      <Label htmlFor="disponibilidade-data" className={labelCls}>
        A data está livre?
      </Label>
      <div className="flex gap-2">
        <Input
          id="disponibilidade-data"
          type="date"
          min={todayIso}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setResult(null);
            setError(null);
          }}
          className={cn(inputCls, "flex-1")}
        />
        <button type="submit" disabled={isPending} className={cn(btn.secondary, "px-4")}>
          {isPending ? <Loader2 className="size-4 animate-spin" aria-label="Consultando" /> : "Consultar"}
        </button>
      </div>
      <div id="disponibilidade-resultado" role="status" aria-live="polite">
        {result ? (
          result.available ? (
            <p className="flex items-start gap-2 rounded-[12px] bg-sucesso-suave px-3 py-2 text-sm font-semibold text-sucesso">
              <CalendarCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Data livre em {dateLabel(result.date)}. Peça seu orçamento.
            </p>
          ) : (
            <p className="flex items-start gap-2 rounded-[12px] bg-perigo-suave px-3 py-2 text-sm font-semibold text-perigo">
              <CalendarX className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Data ocupada em {dateLabel(result.date)}.
            </p>
          )
        ) : null}
        {error ? <p className="text-sm font-semibold text-perigo">{error}</p> : null}
      </div>
    </form>
  );
}

export function VendorDetailClient({ vendor, todayIso }: VendorDetailClientProps) {
  let galleryImages = parseGallery(vendor.galleryImages);
  if (galleryImages.length === 0 && vendor.coverUrl) {
    galleryImages = [vendor.coverUrl];
  }

  const serviceRegions = parseRegions(vendor.serviceRegions);
  const isMaster = vendor.planTier === "MASTER";
  // WhatsApp direto é recurso do Pro/Master (o servidor nem envia o número dos demais).
  const directWhatsapp = vendor.planTier !== "FREE" ? vendor.whatsapp?.replace(/\D/g, "") || null : null;

  // Foto da galeria em destaque no celular e foto aberta na janela de fotos (-1 = fechada).
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState(-1);
  const reviews = vendor.reviews;

  // Formulário de Lead / Reunião
  const [coupleName, setCoupleName] = useState("");
  const [couplePhone, setCouplePhone] = useState("");
  const [coupleEmail, setCoupleEmail] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [meetingType, setMeetingType] = useState<"ONLINE" | "PRESENTIAL">("ONLINE");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadLocation, setLeadLocation] = useState("");
  const [leadBudget, setLeadBudget] = useState("");
  const [isPendingLead, startTransitionLead] = useTransition();
  // Pedido enviado: a confirmação fica na tela (um aviso passageiro some antes de ser lido).
  const [sentTo, setSentTo] = useState<{ coupleName: string } | null>(null);

  const handleSendLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleName || !couplePhone) {
      toast.error("Preencha seu nome e WhatsApp para o fornecedor poder responder.");
      return;
    }

    const toastId = toast.loading(`Enviando o pedido para ${vendor.companyName}...`);
    startTransitionLead(async () => {
      const res = await createVendorLead({
        vendorId: vendor.id,
        coupleName,
        couplePhone,
        coupleEmail,
        guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
        weddingDate: weddingDate ? new Date(weddingDate) : undefined,
        message: leadMessage,
        meetingType,
        location: leadLocation,
        budget: leadBudget,
      });

      if (res.success) {
        toast.dismiss(toastId);
        setSentTo({ coupleName });
        setCoupleName("");
        setCouplePhone("");
        setCoupleEmail("");
        setGuestCount("");
        setLeadMessage("");
        setLeadLocation("");
        setLeadBudget("");
      } else {
        toast.error(res.error || "Não conseguimos enviar o pedido. Tente de novo.", { id: toastId });
      }
    });
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : vendor.rating.toFixed(1);

  const price = vendor.startingPrice && vendor.startingPrice > 0 ? brl.format(vendor.startingPrice / 100) : null;
  const mosaic = galleryImages.slice(0, 5);
  const showWhere = serviceRegions.length > 0 ? serviceRegions.join(", ") : null;

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: vendor.companyName, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado.");
    }
  };

  const step = (delta: number) => setLightbox((i) => (i < 0 ? i : (i + delta + galleryImages.length) % galleryImages.length));

  return (
    <div className="flex min-h-screen flex-col bg-linho font-sans text-tinta">
      <LandingHeader />

      <div className={cn(container, "flex flex-1 flex-col gap-6 pb-0 pt-4 sm:pt-6 lg:pb-24")}>
        {/* Voltar e compartilhar */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/fornecedores" className={cn(btn.quiet, "-ml-3 shrink-0")}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Fornecedores
          </Link>
          <button type="button" onClick={share} className={cn(btn.secondary, btn.sm)}>
            <Share2 className="size-4" aria-hidden="true" />
            Compartilhar
          </button>
        </div>

        {/* Fotos: mosaico no computador, foto grande com miniaturas no celular */}
        {galleryImages.length > 0 ? (
          <section aria-label="Fotos do trabalho">
            <div className="hidden md:grid md:auto-rows-[200px] md:grid-cols-4 md:gap-2 md:overflow-hidden md:rounded-[16px]">
              {mosaic.map((img, i) => (
                <div key={i} className={cn("relative bg-areia", mosaicCell(i, mosaic.length))}>
                  <button
                    type="button"
                    onClick={() => setLightbox(i)}
                    aria-label={`Ampliar foto ${i + 1} de ${galleryImages.length}`}
                    className="absolute inset-0 block cursor-zoom-in"
                  >
                    <UserImage
                      src={img}
                      alt=""
                      sizes={i === 0 ? "(min-width: 1200px) 600px, 50vw" : "(min-width: 1200px) 300px, 25vw"}
                      className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                      priority={i === 0}
                    />
                  </button>
                  {i === mosaic.length - 1 && galleryImages.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setLightbox(0)}
                      className={cn(btn.secondary, btn.sm, "absolute bottom-3 right-3")}
                    >
                      Ver as {galleryImages.length} fotos
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-salvia-suave">
                <UserImage
                  src={galleryImages[activeIndex] ?? galleryImages[0]}
                  alt={`Foto ${activeIndex + 1} de ${vendor.companyName}`}
                  sizes="100vw"
                  className="object-cover"
                  priority
                />
                {galleryImages.length > 1 ? (
                  <span className="absolute bottom-3 right-3 rounded-full bg-papel px-3 py-1 text-sm font-semibold text-tinta">
                    {activeIndex + 1} / {galleryImages.length}
                  </span>
                ) : null}
              </div>
              {galleryImages.length > 1 ? (
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {galleryImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveIndex(i)}
                      aria-label={`Ver foto ${i + 1}`}
                      aria-pressed={activeIndex === i}
                      className={cn(
                        "relative size-[60px] shrink-0 cursor-pointer overflow-hidden rounded-[12px] border-2 bg-areia",
                        activeIndex === i ? "border-ameixa" : "border-transparent opacity-80",
                      )}
                    >
                      <UserImage src={img} alt="" sizes="60px" className="object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : (
          <div className="flex aspect-[16/6] w-full flex-col items-center justify-center gap-1 rounded-[16px] bg-salvia-suave text-sm text-tinta-suave">
            <Camera className="size-8" aria-hidden="true" />
            Este fornecedor ainda não enviou fotos.
          </div>
        )}

        <div className="flex flex-wrap items-start gap-x-12 gap-y-10 pt-4">
          <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-10">
            {/* Título */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex min-h-7 items-center rounded-[6px] bg-salvia-suave px-3 text-sm font-semibold text-salvia">
                  {vendor.category}
                </span>
                {vendor.isVerified ? (
                  <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-sucesso-suave pl-2 pr-3 text-sm font-semibold text-sucesso">
                    <Check className="size-4" aria-hidden="true" />
                    Verificado pela curadoria
                  </span>
                ) : null}
                {isMaster ? (
                  <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-ameixa-suave pl-2 pr-3 text-sm font-semibold text-ameixa">
                    <Sparkles className="size-4" aria-hidden="true" />
                    Destaque
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-4">
                {vendor.logoUrl ? (
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-linha bg-papel sm:size-16">
                    <UserImage src={vendor.logoUrl} alt="" sizes="64px" className="object-cover" />
                  </div>
                ) : null}
                <h1 className="font-display text-[34px] font-normal leading-10 tracking-[-0.015em] text-tinta sm:text-5xl sm:leading-[54px]">
                  {vendor.companyName}
                </h1>
              </div>

              <p className="flex flex-wrap gap-x-4 gap-y-2 text-base text-tinta-suave">
                {showWhere ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 shrink-0" aria-hidden="true" />
                    {showWhere}
                  </span>
                ) : null}
                {reviews.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="size-4 shrink-0 fill-champanhe text-champanhe" aria-hidden="true" />
                    <strong className="font-semibold text-tinta">{averageRating}</strong>
                    <span className="sr-only">de 5 estrelas,</span>({reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"})
                  </span>
                ) : null}
                {vendor.documentNumber ? (
                  <span className="tabular-nums">
                    {vendor.documentType || "CNPJ"}: {vendor.documentNumber}
                  </span>
                ) : null}
              </p>
            </div>

            {/* Sobre */}
            {vendor.description ? (
              <section className="flex flex-col gap-3">
                <h2 className={sectionTitle}>Sobre</h2>
                <p className="max-w-[68ch] whitespace-pre-line text-[17px] leading-7 text-tinta-suave sm:text-lg">{vendor.description}</p>
              </section>
            ) : null}

            {/* Atendimento */}
            {serviceRegions.length > 0 || vendor.offersOnlineMeet || (vendor.hasPhysicalSpace && vendor.address) || vendor.instagram || vendor.website ? (
              <section className="flex flex-col gap-4">
                <h2 className={sectionTitle}>Como atende</h2>
                {serviceRegions.length > 0 ? (
                  <ul className="flex flex-wrap gap-2" aria-label="Regiões atendidas">
                    {serviceRegions.map((region) => (
                      <li
                        key={region}
                        className="inline-flex min-h-8 items-center gap-1.5 rounded-[8px] bg-areia px-3 text-sm font-semibold text-tinta-suave"
                      >
                        <MapPin className="size-4" aria-hidden="true" />
                        {region}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {vendor.offersOnlineMeet ? (
                    <div className="flex items-center gap-3 rounded-[16px] border border-linha bg-papel p-4 shadow-aceito-1">
                      <Video className="size-5 shrink-0 text-sucesso" aria-hidden="true" />
                      <div>
                        <p className="font-semibold">Reunião por vídeo</p>
                        <p className="text-sm text-tinta-suave">Para quem mora longe ou tem pouco tempo.</p>
                      </div>
                    </div>
                  ) : null}
                  {vendor.hasPhysicalSpace && vendor.address ? (
                    <div className="flex items-center gap-3 rounded-[16px] border border-linha bg-papel p-4 shadow-aceito-1">
                      <Building2 className="size-5 shrink-0 text-tinta-suave" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="font-semibold">Atendimento no local</p>
                        <p className="text-sm text-tinta-suave">{vendor.address}</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {vendor.instagram || vendor.website ? (
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    {vendor.instagram ? (
                      <a
                        href={`https://instagram.com/${vendor.instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 font-semibold text-ameixa hover:underline"
                      >
                        <Camera className="size-4" aria-hidden="true" />
                        {vendor.instagram}
                        <span className="sr-only"> (abre em nova aba)</span>
                      </a>
                    ) : null}
                    {vendor.website ? (
                      <a
                        href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 font-semibold text-ameixa hover:underline"
                      >
                        <Globe className="size-4" aria-hidden="true" />
                        Site do fornecedor
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                        <span className="sr-only"> (abre em nova aba)</span>
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* Avaliações */}
            <section className="flex flex-col gap-4" aria-labelledby="avaliacoes">
              <div className="flex flex-col gap-1">
                <h2 id="avaliacoes" className={sectionTitle}>
                  O que os casais dizem
                </h2>
                <p className="text-sm text-tinta-suave">Só quem fechou pelo Aceito recebe o link para avaliar.</p>
              </div>

              {reviews.length === 0 ? (
                <p className="rounded-[16px] border border-linha bg-papel p-6 text-base text-tinta-suave shadow-aceito-1">
                  Ainda não há avaliações de casais que fecharam por aqui.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {reviews.map((rev) => (
                    <figure key={rev.id} className="m-0 flex flex-col gap-3 rounded-[16px] border border-linha bg-papel p-6 shadow-aceito-1">
                      <div className="flex items-center gap-0.5" role="img" aria-label={`${rev.rating} de 5 estrelas`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            aria-hidden="true"
                            className={cn("size-4", i < rev.rating ? "fill-champanhe text-champanhe" : "text-linha")}
                          />
                        ))}
                      </div>
                      <blockquote className="m-0 font-display text-xl italic leading-7 text-tinta">“{rev.comment}”</blockquote>
                      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tinta-suave">
                        <span>
                          {rev.coupleNames}
                          {rev.weddingDate
                            ? ` · casou em ${new Date(rev.weddingDate).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}`
                            : ""}
                        </span>
                        {rev.isVerified ? (
                          <span className="inline-flex min-h-6 items-center gap-1 rounded-[6px] bg-sucesso-suave pl-1.5 pr-2 text-sm font-semibold text-sucesso">
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                            Casamento confirmado
                          </span>
                        ) : null}
                      </figcaption>

                      {rev.reply ? (
                        <div className="rounded-[12px] border-l-2 border-champanhe bg-areia/60 px-4 py-3">
                          <p className="text-sm font-semibold text-tinta-suave">Resposta de {vendor.companyName}</p>
                          <p className="whitespace-pre-line break-words text-base leading-6 text-tinta">{rev.reply}</p>
                        </div>
                      ) : null}
                    </figure>
                  ))}
                </div>
              )}
            </section>
          </main>

          {/* Pedido de orçamento */}
          <aside className="min-w-0 max-w-[400px] flex-[1_1_320px] max-lg:max-w-none lg:sticky lg:top-24">
            <div className="flex flex-col gap-5 rounded-[16px] border border-linha bg-papel p-6 shadow-aceito-2">
              <p className="flex flex-col">
                <span className="text-tinta-suave">{price ? "A partir de" : "Preço"}</span>
                <span className="font-display text-[34px] leading-10 text-tinta">{price ?? "Sob consulta"}</span>
                {vendor.averageTicket ? (
                  <span className="mt-1 text-sm text-tinta-suave">Valor médio dos serviços: {brl.format(vendor.averageTicket / 100)}</span>
                ) : null}
              </p>

              <AvailabilityCheck vendorId={vendor.id} todayIso={todayIso} />

              <div id="orcamento" className="scroll-mt-24 border-t border-linha pt-5">
                <h2 className="font-display text-[22px] font-medium leading-7 text-tinta">Pedir orçamento</h2>
                <p className="mb-4 mt-1 text-sm leading-5 text-tinta-suave">
                  Envie seus dados e o fornecedor responde com a disponibilidade na sua data.
                </p>

                {sentTo ? (
                  <div role="status" className="flex flex-col gap-3 rounded-[16px] border border-sucesso/30 bg-sucesso-suave p-4 text-base text-tinta">
                    <p className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="size-5 shrink-0 text-sucesso" aria-hidden="true" />
                      Pedido enviado para {vendor.companyName}
                    </p>
                    <p className="text-tinta-suave">
                      Recebemos os seus dados, {sentTo.coupleName.split(" ")[0]}. O fornecedor vai entrar em contato pelo WhatsApp que você informou.
                    </p>
                    {directWhatsapp ? (
                      <a
                        href={`https://wa.me/${directWhatsapp}?text=${encodeURIComponent(`Olá! Sou ${sentTo.coupleName} e acabei de pedir um orçamento pelo Aceito.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(btn.primary, btn.block)}
                      >
                        Conversar agora no WhatsApp
                        <span className="sr-only"> (abre em nova aba)</span>
                      </a>
                    ) : null}
                    <button type="button" onClick={() => setSentTo(null)} className={cn(btn.quiet, btn.block)}>
                      Fazer outro pedido
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendLead} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="lead-nome" className={labelCls}>
                        Seu nome
                      </Label>
                      <Input
                        id="lead-nome"
                        name="name"
                        autoComplete="name"
                        value={coupleName}
                        onChange={(e) => setCoupleName(e.target.value)}
                        placeholder="Ex.: Giovanna"
                        required
                        className={inputCls}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="lead-telefone" className={labelCls}>
                        Seu WhatsApp com DDD
                      </Label>
                      <Input
                        id="lead-telefone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        value={couplePhone}
                        onChange={(e) => setCouplePhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        required
                        className={inputCls}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className={labelCls}>Data do casamento</Label>
                      <DatePicker
                        value={weddingDate}
                        onChange={(e) => setWeddingDate(e.target.value)}
                        placeholder="Escolha a data"
                        className={inputCls}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="lead-cidade" className={labelCls}>
                        Cidade do casamento
                      </Label>
                      <Input
                        id="lead-cidade"
                        value={leadLocation}
                        onChange={(e) => setLeadLocation(e.target.value)}
                        placeholder="Ex.: Itu, SP"
                        maxLength={80}
                        autoComplete="address-level2"
                        className={inputCls}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="lead-orcamento" className={labelCls}>
                        Quanto vocês pensam em investir
                      </Label>
                      <select
                        id="lead-orcamento"
                        value={leadBudget}
                        onChange={(e) => setLeadBudget(e.target.value)}
                        className="min-h-11 w-full cursor-pointer rounded-[12px] border border-linha-forte bg-papel px-3 text-base text-tinta"
                      >
                        <option value="">Escolha (opcional)</option>
                        {LEAD_BUDGET_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <fieldset className="flex flex-col gap-2">
                      <legend className={cn(labelCls, "mb-2")}>Como prefere conversar?</legend>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            ["ONLINE", "Por vídeo", Video],
                            ["PRESENTIAL", "Presencial", Building2],
                          ] as const
                        ).map(([value, label, Icon]) => (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={meetingType === value}
                            onClick={() => setMeetingType(value)}
                            className={cn(
                              "flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-[12px] border px-3 text-base font-semibold transition-colors",
                              meetingType === value
                                ? "border-ameixa bg-ameixa-suave text-ameixa"
                                : "border-linha-forte bg-papel text-tinta-suave hover:border-ameixa",
                            )}
                          >
                            <Icon className="size-4" aria-hidden="true" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <button type="submit" disabled={isPendingLead} className={cn(btn.primary, btn.block)}>
                      {isPendingLead ? <Loader2 className="size-4 animate-spin" aria-label="Enviando" /> : "Pedir orçamento"}
                    </button>
                    {directWhatsapp ? (
                      <a
                        href={`https://wa.me/${directWhatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(btn.secondary, btn.block)}
                      >
                        Conversar no WhatsApp
                        <span className="sr-only"> (abre em nova aba)</span>
                      </a>
                    ) : null}
                  </form>
                )}
              </div>
            </div>
          </aside>
        </div>
        {/* Celular: preço e o botão principal sempre à mão (sticky: o pai tem transform, que quebraria o fixed) */}
        <div className="sticky bottom-0 z-40 -mx-4 mt-auto flex items-center justify-between gap-4 border-t border-linha bg-papel px-4 py-3 sm:-mx-6 sm:px-6 lg:hidden">
          <p className="flex flex-col leading-tight">
            <span className="text-sm text-tinta-suave">{price ? "A partir de" : "Preço"}</span>
            <span className="font-display text-xl text-tinta">{price ?? "Sob consulta"}</span>
          </p>
          <a href="#orcamento" className={cn(btn.primary, "flex-1 max-w-[240px]")}>
            Pedir orçamento
          </a>
        </div>
      </div>

      {/* Fotos ampliadas */}
      <Dialog open={lightbox >= 0} onOpenChange={(open) => !open && setLightbox(-1)}>
        <DialogContent className="max-w-[min(960px,calc(100%-1rem))] gap-3 rounded-[16px] bg-papel p-3 sm:max-w-[min(960px,calc(100%-2rem))]">
          <DialogTitle className="sr-only">Fotos de {vendor.companyName}</DialogTitle>
          <DialogDescription className="sr-only">Use as setas para ver as outras fotos.</DialogDescription>
          {lightbox >= 0 ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[12px] bg-areia">
              <UserImage src={galleryImages[lightbox]} alt={`Foto ${lightbox + 1} de ${galleryImages.length}`} sizes="960px" className="object-contain" />
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => step(-1)} className={cn(btn.secondary, btn.sm)} aria-label="Foto anterior">
              <ChevronLeft className="size-4" aria-hidden="true" />
              Anterior
            </button>
            <span className="text-sm font-semibold text-tinta-suave">
              {lightbox + 1} / {galleryImages.length}
            </span>
            <button type="button" onClick={() => step(1)} className={cn(btn.secondary, btn.sm)} aria-label="Próxima foto">
              Próxima
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <LandingFooter />
    </div>
  );
}
