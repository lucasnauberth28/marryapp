"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import {
  Building2,
  Star,
  MapPin,
  Video,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  ArrowLeft,
  Share2,
  Globe,
  Sparkles,
  Camera,
  Loader2,
  CalendarCheck,
  CalendarX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { checkVendorAvailability, createVendorLead, type PublicVendor } from "@/actions/partner-vendor-actions";
import { toast } from "sonner";
import { LEAD_BUDGET_OPTIONS, parseGallery, parseRegions } from "@/app/(fornecedor)/_lib/vendor-panel";
import { UserImage } from "@/components/ui/user-image";

interface VendorDetailClientProps {
  vendor: PublicVendor;
  /** Hoje em Brasília ("AAAA-MM-DD"), mínimo da consulta de disponibilidade. */
  todayIso: string;
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
    <form onSubmit={onSubmit} className="space-y-2" aria-describedby="disponibilidade-resultado">
      <Label htmlFor="disponibilidade-data" className="text-xs font-bold text-tinta-suave uppercase">
        Ver disponibilidade
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
          className="h-10 flex-1 rounded-xl bg-linho text-xs"
        />
        <Button type="submit" variant="outline" disabled={isPending} className="h-10 rounded-xl text-xs font-bold">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Consultar"}
        </Button>
      </div>
      <div id="disponibilidade-resultado" role="status" aria-live="polite">
        {result ? (
          result.available ? (
            <p className="flex items-center gap-1.5 rounded-xl bg-sucesso-suave px-3 py-2 text-xs font-bold text-sucesso">
              <CalendarCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              Data disponível em {dateLabel(result.date)}. Peça seu orçamento!
            </p>
          ) : (
            <p className="flex items-center gap-1.5 rounded-xl bg-perigo-suave px-3 py-2 text-xs font-bold text-perigo">
              <CalendarX className="h-4 w-4 shrink-0" aria-hidden="true" />
              Data indisponível em {dateLabel(result.date)}.
            </p>
          )
        ) : null}
        {error ? <p className="text-xs font-medium text-perigo">{error}</p> : null}
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

  const [activeImage, setActiveImage] = useState(galleryImages[0] || vendor.coverUrl);
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

  const handleSendLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleName || !couplePhone) {
      toast.error("Preencha seu nome e WhatsApp para contato.");
      return;
    }

    const toastId = toast.loading(`Enviando solicitação para ${vendor.companyName}...`);
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
        const whatsapp = directWhatsapp;
        toast.success(`Pedido enviado para ${vendor.companyName}.`, {
          id: toastId,
          description: "O fornecedor recebeu seus dados e vai entrar em contato.",
          action: whatsapp
            ? {
                label: "Conversar no WhatsApp",
                onClick: () =>
                  window.open(
                    `https://wa.me/${whatsapp}?text=${encodeURIComponent(
                      `Olá! Sou ${coupleName} e acabei de pedir um orçamento pelo Aceito.`
                    )}`,
                    "_blank",
                    "noopener,noreferrer"
                  ),
              }
            : undefined,
        });
        setCoupleName("");
        setCouplePhone("");
        setCoupleEmail("");
        setGuestCount("");
        setLeadMessage("");
        setLeadLocation("");
        setLeadBudget("");
      } else {
        toast.error(res.error || "Erro ao solicitar orçamento.", { id: toastId });
      }
    });
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : vendor.rating.toFixed(1);

  return (
    <div className="min-h-screen bg-paper text-tinta font-sans flex flex-col justify-between">
      <LandingHeader />

      <div className="flex-1 py-8 px-6 max-w-7xl mx-auto w-full space-y-8">
        {/* Navegação Superior */}
        <div className="flex items-center justify-between">
          <Link
            href="/fornecedores"
            className="inline-flex items-center gap-2 text-xs font-bold text-tinta-suave hover:text-tinta transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Todos os Fornecedores</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: vendor.companyName,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copiado para a área de transferência!");
                }
              }}
              className="rounded-full text-xs font-bold gap-1.5 h-9"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartilhar</span>
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CABEÇALHO DO PERFIL DO FORNECEDOR */}
        {/* ========================================================================= */}
        <div className="bg-papel rounded-3xl p-6 sm:p-8 border border-linha shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Logotipo / Avatar do Fornecedor */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-brand-50 border-2 border-brand/30 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
              {vendor.logoUrl ? (
                <UserImage src={vendor.logoUrl} alt={vendor.companyName} sizes="96px" className="object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-brand" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-display text-tinta">
                  {vendor.companyName}
                </h1>
                {vendor.isVerified && (
                  <span className="bg-brand-50 text-brand border border-brand/30 font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                    <span>Curadoria Aprovada</span>
                  </span>
                )}
                {isMaster && (
                  <span className="bg-amber-700 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Destaque</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-tinta-suave">
                <span className="font-bold text-tinta bg-areia px-2.5 py-0.5 rounded-full">
                  {vendor.category}
                </span>

                {vendor.priceRange && (
                  <span className="font-semibold tracking-wider text-aviso bg-aviso-suave px-2.5 py-0.5 rounded-full border border-amber-200">
                    Faixa: {vendor.priceRange}
                  </span>
                )}

                <div className="flex items-center gap-1 font-bold text-tinta">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{averageRating}</span>
                  <span className="text-tinta-suave font-normal">
                    ({reviews.length} avaliações)
                  </span>
                </div>
              </div>

              {vendor.documentNumber && (
                <p className="text-xs text-tinta-suave tabular-nums">
                  {vendor.documentType || "CNPJ"}: {vendor.documentNumber}
                </p>
              )}
            </div>
          </div>

          {/* Ações Rápidas no Topo */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button asChild className="w-full rounded-2xl h-12 text-sm font-semibold gap-1.5 shadow-xs md:w-auto">
              <a href="#orcamento">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                Pedir orçamento
              </a>
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CORPO PRINCIPAL: GALERIA, DETALHES, AVALIAÇÕES E FORMULÁRIO */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LADO ESQUERDO: GALERIA DE FOTOS, SOBRE E AVALIAÇÕES (8 COLUNAS) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Galeria de Fotos Interativa */}
            <div className="bg-papel rounded-3xl p-6 sm:p-8 border border-linha shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display text-tinta flex items-center gap-2">
                  <Camera className="w-5 h-5 text-brand" />
                  <span>Portfólio & Fotos Reais</span>
                </h2>
                <span className="text-xs text-tinta-suave font-medium">
                  {galleryImages.length} imagens disponíveis
                </span>
              </div>

              {/* Imagem Principal em Destaque */}
              <div className="relative w-full h-80 sm:h-[420px] rounded-2xl overflow-hidden bg-areia border border-linha">
                {activeImage ? (
                  <UserImage
                    src={activeImage}
                    alt={vendor.companyName}
                    sizes="(min-width: 1024px) 700px, 100vw"
                    className="object-cover transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <Camera className="w-12 h-12" aria-hidden="true" />
                  </div>
                )}
              </div>

              {/* Miniaturas Clicáveis */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide pt-1">
                  {galleryImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(img)}
                      aria-label={`Ver foto ${i + 1}`}
                      aria-pressed={activeImage === img}
                      className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        activeImage === img
                          ? "border-brand scale-105 shadow-md"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <UserImage src={img} alt={`Portfólio ${i + 1}`} sizes="96px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sobre o Fornecedor & Diferenciais */}
            <div className="bg-papel rounded-3xl p-6 sm:p-8 border border-linha shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-display text-tinta mb-3">
                  Sobre a Empresa
                </h2>
                <p className="text-sm text-tinta-suave leading-relaxed whitespace-pre-line">
                  {vendor.description}
                </p>
              </div>

              {/* Regiões de Atendimento */}
              <div className="pt-4 border-t border-linha space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-tinta-suave">
                  Regiões e Cidades Atendidas
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {serviceRegions.map((region, i) => (
                    <span
                      key={i}
                      className="text-xs bg-brand-50 text-brand border border-brand/20 px-3 py-1 rounded-full font-medium flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{region}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Endereço e Atendimento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-linha text-xs text-tinta-suave">
                {vendor.offersOnlineMeet && (
                  <div className="flex items-center gap-2 bg-sucesso-suave text-sucesso p-3 rounded-2xl border border-emerald-200">
                    <Video className="w-4 h-4 text-sucesso shrink-0" />
                    <div>
                      <p className="font-bold">Reuniões por Vídeo</p>
                      <p className="text-xs text-sucesso">Google Meet & Zoom disponíveis</p>
                    </div>
                  </div>
                )}

                {vendor.hasPhysicalSpace && vendor.address && (
                  <div className="flex items-center gap-2 bg-linho text-tinta p-3 rounded-2xl border border-linha">
                    <Building2 className="w-4 h-4 text-tinta-suave shrink-0" />
                    <div>
                      <p className="font-bold">Showroom / Espaço Físico</p>
                      <p className="text-xs text-tinta-suave line-clamp-1">{vendor.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Redes Sociais e Website */}
              <div className="pt-4 border-t border-linha flex flex-wrap items-center gap-4">
                {vendor.instagram && (
                  <a
                    href={`https://instagram.com/${vendor.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-tinta-suave hover:text-brand transition-colors"
                  >
                    <Camera className="w-4 h-4 text-pink-600" />
                    <span>{vendor.instagram}</span>
                  </a>
                )}

                {vendor.website && (
                  <a
                    href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-tinta-suave hover:text-brand transition-colors"
                  >
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Website Oficial</span>
                    <ExternalLink className="w-3 h-3 text-tinta-suave" />
                  </a>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SISTEMA DE AVALIAÇÕES DE CASAIS */}
            {/* ========================================================================= */}
            <div className="bg-papel rounded-3xl p-6 sm:p-8 border border-linha shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-linha pb-4">
                <div>
                  <h2 className="text-xl font-display text-tinta flex items-center gap-2">
                    <Star className="w-5 h-5 text-aviso fill-amber-500" />
                    <span>Avaliações dos Noivos</span>
                  </h2>
                  <p className="text-xs text-tinta-suave mt-0.5">
                    Experiências reais de casais que contrataram este fornecedor. Só quem fechou pelo Aceito recebe o link para avaliar.
                  </p>
                </div>

              </div>

              {/* Lista de Avaliações */}
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-tinta-suave space-y-2">
                  <Star className="w-8 h-8 mx-auto text-stone-300" />
                  <p className="text-xs">Este fornecedor ainda não recebeu avaliações de casais que fecharam pelo Aceito.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-2xl bg-ivory border border-linha/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm text-tinta">
                            {rev.coupleNames}
                          </span>
                          {rev.isVerified && (
                            <span className="bg-emerald-100 text-sucesso text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-sucesso" />
                              <span>Casamento Verificado</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-stone-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-tinta-suave leading-relaxed">
                        “{rev.comment}”
                      </p>

                      {rev.weddingDate && (
                        <p className="text-xs text-tinta-suave">
                          Casamento realizado em:{" "}
                          {new Date(rev.weddingDate).toLocaleDateString("pt-BR", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      )}

                      {rev.reply && (
                        <div className="mt-3 rounded-xl border-l-2 border-champanhe bg-areia/60 px-4 py-3 space-y-1">
                          <p className="text-xs font-semibold text-tinta-suave">
                            Resposta de {vendor.companyName}
                          </p>
                          <p className="text-sm text-tinta leading-relaxed whitespace-pre-line break-words">
                            {rev.reply}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LADO DIREITO: CARD STICKY DE ORÇAMENTO & AGENDAMENTO (4 COLUNAS) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 sticky top-20 space-y-6">
            <div className="bg-papel rounded-3xl p-6 sm:p-8 border-2 border-brand/30 shadow-xl space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-tinta-suave block">
                  Investimento Estimado
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xs text-tinta-suave font-medium">A partir de</span>
                  <span className="text-3xl text-tinta font-display">
                    {vendor.startingPrice
                      ? new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(vendor.startingPrice / 100)
                      : "Sob Consulta"}
                  </span>
                </div>
                {vendor.averageTicket && (
                  <p className="text-xs text-tinta-suave mt-1">
                    Ticket médio:{" "}
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(vendor.averageTicket / 100)}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-linha">
                <AvailabilityCheck vendorId={vendor.id} todayIso={todayIso} />
              </div>

              <div id="orcamento" className="pt-4 border-t border-linha scroll-mt-24">
                <h3 className="text-sm font-display text-tinta mb-1">
                  Pedir orçamento ou reunião
                </h3>
                <p className="text-xs text-tinta-suave mb-4">
                  Envie seus dados e o fornecedor responderá com disponibilidade na sua data.
                </p>

                <form onSubmit={handleSendLead} className="space-y-3.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-tinta-suave uppercase">Seu Nome</Label>
                    <Input
                      value={coupleName}
                      onChange={(e) => setCoupleName(e.target.value)}
                      placeholder="Ex: Giovanna"
                      required
                      className="rounded-xl h-10 text-xs bg-linho"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-tinta-suave uppercase">WhatsApp</Label>
                    <Input
                      value={couplePhone}
                      onChange={(e) => setCouplePhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      required
                      className="rounded-xl h-10 text-xs bg-linho font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-tinta-suave uppercase">Data do Casamento</Label>
                    <DatePicker
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      placeholder="Selecione a data"
                      className="rounded-xl h-10 text-xs bg-linho"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="lead-cidade" className="text-xs font-bold text-tinta-suave uppercase">
                      Cidade do casamento
                    </Label>
                    <Input
                      id="lead-cidade"
                      value={leadLocation}
                      onChange={(e) => setLeadLocation(e.target.value)}
                      placeholder="Ex: Itu, SP"
                      maxLength={80}
                      autoComplete="address-level2"
                      className="rounded-xl h-10 text-xs bg-linho"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="lead-orcamento" className="text-xs font-bold text-tinta-suave uppercase">
                      Faixa de orçamento
                    </Label>
                    <select
                      id="lead-orcamento"
                      value={leadBudget}
                      onChange={(e) => setLeadBudget(e.target.value)}
                      className="h-10 w-full cursor-pointer rounded-xl border border-linha bg-linho px-3 text-xs text-tinta"
                    >
                      <option value="">Selecione (opcional)</option>
                      {LEAD_BUDGET_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-tinta-suave uppercase">Tipo de Reunião</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMeetingType("ONLINE")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                          meetingType === "ONLINE"
                            ? "bg-brand-50 border-brand text-brand"
                            : "bg-linho border-linha text-tinta-suave"
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Online</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMeetingType("PRESENTIAL")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                          meetingType === "PRESENTIAL"
                            ? "bg-brand-50 border-brand text-brand"
                            : "bg-linho border-linha text-tinta-suave"
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Presencial</span>
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isPendingLead}
                    className="w-full bg-brand hover:bg-brand-600 text-white rounded-full font-bold h-12 text-xs shadow-md gap-2 mt-3 cursor-pointer"
                  >
                    {isPendingLead ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>Solicitar Atendimento</span>
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Garantia Aceito */}
              <div className="pt-4 border-t border-linha text-xs text-tinta-suave space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sucesso shrink-0" />
                  <span>Profissional verificado pela curadoria.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
