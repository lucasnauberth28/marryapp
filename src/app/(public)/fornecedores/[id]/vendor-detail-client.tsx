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
  Heart,
  Globe,
  Phone,
  FileText,
  Sparkles,
  Camera,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { createVendorLead, createVendorReview } from "@/actions/partner-vendor-actions";
import { toast } from "sonner";

interface VendorDetailClientProps {
  vendor: any;
}

export function VendorDetailClient({ vendor }: VendorDetailClientProps) {
  let galleryImages: string[] = [];
  try {
    galleryImages = JSON.parse(vendor.galleryImages || "[]");
  } catch {
    galleryImages = [];
  }
  if (galleryImages.length === 0 && vendor.coverUrl) {
    galleryImages = [vendor.coverUrl];
  }

  let serviceRegions: string[] = [];
  try {
    serviceRegions = JSON.parse(vendor.serviceRegions || "[]");
  } catch {
    serviceRegions = ["São Paulo - Capital"];
  }

  const [activeImage, setActiveImage] = useState(galleryImages[0] || vendor.coverUrl);
  const [reviews, setReviews] = useState<any[]>(vendor.reviews || []);

  // Modal de Avaliação
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewCoupleNames, setReviewCoupleNames] = useState("");
  const [reviewWeddingDate, setReviewWeddingDate] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isPendingReview, startTransitionReview] = useTransition();

  // Formulário de Lead / Reunião
  const [coupleName, setCoupleName] = useState("");
  const [couplePhone, setCouplePhone] = useState("");
  const [coupleEmail, setCoupleEmail] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [meetingType, setMeetingType] = useState<"ONLINE" | "PRESENTIAL">("ONLINE");
  const [leadMessage, setLeadMessage] = useState("");
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
      });

      if (res.success) {
        const whatsapp = vendor.whatsapp?.replace(/\D/g, "");
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
      } else {
        toast.error(res.error || "Erro ao solicitar orçamento.", { id: toastId });
      }
    });
  };

  const handleSendReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewCoupleNames || !reviewComment) {
      toast.error("Preencha o nome do casal e o seu depoimento.");
      return;
    }

    const toastId = toast.loading("Publicando sua avaliação...");
    startTransitionReview(async () => {
      const res = await createVendorReview({
        vendorId: vendor.id,
        coupleNames: reviewCoupleNames,
        weddingDate: reviewWeddingDate ? new Date(reviewWeddingDate) : undefined,
        rating: reviewRating,
        comment: reviewComment,
      });

      if (res.success && res.review) {
        toast.success("Avaliação publicada com sucesso! Obrigado por compartilhar sua experiência.", {
          id: toastId,
        });
        setReviews([res.review, ...reviews]);
        setReviewModalOpen(false);
        setReviewCoupleNames("");
        setReviewComment("");
      } else {
        toast.error(res.error || "Erro ao publicar avaliação.", { id: toastId });
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
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-brand-50 border-2 border-brand/30 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
              {vendor.logoUrl ? (
                <img
                  src={vendor.logoUrl}
                  alt={vendor.companyName}
                  className="w-full h-full object-cover"
                />
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
              <div className="w-full h-80 sm:h-[420px] rounded-2xl overflow-hidden bg-areia border border-linha">
                <img
                  src={activeImage}
                  alt={vendor.companyName}
                  className="w-full h-full object-cover transition-all duration-500"
                />
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
                      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        activeImage === img
                          ? "border-brand scale-105 shadow-md"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Portfólio ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
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
                    Experiências reais de casais que contrataram este fornecedor.
                  </p>
                </div>

                <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-brand hover:bg-brand-600 text-white rounded-full text-xs font-bold px-5 h-10 shadow-xs cursor-pointer">
                      <span>Deixar Avaliação</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-papel rounded-3xl p-6">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl text-tinta">
                        Avaliar {vendor.companyName}
                      </DialogTitle>
                      <p className="text-xs text-tinta-suave mt-1">
                        Compartilhe como foi a sua experiência para ajudar outros noivos.
                      </p>
                    </DialogHeader>

                    <form onSubmit={handleSendReview} className="space-y-4 pt-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-tinta-suave uppercase">Nomes do Casal</Label>
                        <Input
                          value={reviewCoupleNames}
                          onChange={(e) => setReviewCoupleNames(e.target.value)}
                          placeholder="Ex: Larissa & André"
                          required
                          className="rounded-2xl h-11 text-xs bg-linho"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-tinta-suave uppercase">Data do Casamento</Label>
                        <DatePicker
                          value={reviewWeddingDate}
                          onChange={(e) => setReviewWeddingDate(e.target.value)}
                          placeholder="Selecione a data"
                          className="rounded-2xl h-11 text-xs bg-linho"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-tinta-suave uppercase">Nota (1 a 5 estrelas)</Label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              aria-label={`${star} ${star === 1 ? "estrela" : "estrelas"}`}
                              aria-pressed={star === reviewRating}
                              className="p-1 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= reviewRating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-stone-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-bold text-tinta-suave ml-2">
                            {reviewRating} de 5 estrelas
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-tinta-suave uppercase">Seu Depoimento</Label>
                        <Textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Conte sobre o atendimento, pontualidade, qualidade e como foi o resultado..."
                          required
                          className="rounded-2xl text-xs bg-linho resize-none h-24"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isPendingReview}
                        className="w-full bg-brand hover:bg-brand-600 text-white rounded-full font-bold h-12 text-xs shadow-md gap-2 mt-2"
                      >
                        {isPendingReview ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Publicar Avaliação</span>
                          </>
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Lista de Avaliações */}
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-tinta-suave space-y-2">
                  <Star className="w-8 h-8 mx-auto text-stone-300" />
                  <p className="text-xs">Seja o primeiro casal a avaliar este fornecedor!</p>
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
                        "{rev.comment}"
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
