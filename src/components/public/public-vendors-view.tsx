"use client";

import { useState, useTransition } from "react";
import { Reveal } from "@/components/motion/reveal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import {
  Building2,
  Star,
  MapPin,
  Video,
  Calendar,
  ShieldCheck,
  Search,
  ArrowRight,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { createVendorLead, type PublicVendorListItem } from "@/actions/partner-vendor-actions";
import { parseRegions } from "@/app/(fornecedor)/_lib/vendor-panel";
import { toast } from "sonner";
import { UserImage } from "@/components/ui/user-image";

const CATEGORIES = [
  "TODOS",
  "Espaço",
  "Fotografia",
  "Buffet",
  "Decoração",
  "DJ & Som",
  "Vestidos",
  "Doces & Bolo",
];

const REGIONS = [
  "TODAS",
  "São Paulo - Capital",
  "Grande SP",
  "Litoral Norte",
  "Campinas e Região",
  "Vale do Paraíba",
  "Brasil Todo",
];

interface PublicVendorsViewProps {
  /** Já filtrados pelo servidor quando há data do casamento (sem quem está ocupado nela). */
  initialPartners: PublicVendorListItem[];
  /** Filtro "Data do casamento" em vigor ("AAAA-MM-DD" ou ""). */
  weddingDate?: string;
  todayIso: string;
}

function formatIsoDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function PublicVendorsView({ initialPartners, weddingDate: activeDate = "", todayIso }: PublicVendorsViewProps) {
  const partners = initialPartners;
  const router = useRouter();
  const [dateInput, setDateInput] = useState(activeDate);
  const [isPendingDate, startTransitionDate] = useTransition();
  const [selectedCategory, setSelectedCategory] = useState("TODOS");
  const [selectedRegion, setSelectedRegion] = useState("TODAS");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal de Agendamento de Reunião & Lead
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PublicVendorListItem | null>(null);
  const [coupleName, setCoupleName] = useState("");
  const [couplePhone, setCouplePhone] = useState("");
  const [coupleEmail, setCoupleEmail] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [meetingType, setMeetingType] = useState<"ONLINE" | "PRESENTIAL">("ONLINE");
  const [leadMessage, setLeadMessage] = useState("");
  const [isPendingLead, startTransitionLead] = useTransition();

  const filteredPartners = partners.filter((p) => {
    const matchesCategory = selectedCategory === "TODOS" || p.category === selectedCategory;
    
    let matchesRegion = true;
    if (selectedRegion !== "TODAS") {
      const regions = parseRegions(p.serviceRegions);
      matchesRegion = regions.includes(selectedRegion) || regions.includes("Brasil Todo");
    }

    const matchesSearch =
      !searchTerm ||
      p.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesRegion && matchesSearch;
  });

  // Master: faixa "Em destaque" no topo (eles continuam na lista, que já vem ordenada pelo plano).
  const featuredPartners = filteredPartners.filter((p) => p.planTier === "MASTER").slice(0, 6);

  // A data vai para a URL (?data=): o servidor devolve só quem está livre nesse dia.
  const applyDate = (value: string) => {
    setDateInput(value);
    if (value && value < todayIso) return;
    startTransitionDate(() => {
      router.replace(value ? `/fornecedores?data=${value}` : "/fornecedores", { scroll: false });
    });
  };

  const handleOpenLeadModal = (partner: PublicVendorListItem) => {
    setSelectedPartner(partner);
    setLeadModalOpen(true);
  };

  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner || !coupleName || !couplePhone) {
      toast.error("Preencha seu nome e WhatsApp para contato.");
      return;
    }

    startTransitionLead(async () => {
      const res = await createVendorLead({
        vendorId: selectedPartner.id,
        coupleName,
        couplePhone,
        coupleEmail,
        guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
        weddingDate: weddingDate ? new Date(weddingDate) : undefined,
        message: leadMessage,
        meetingType,
      });

      if (res.success) {
        // WhatsApp direto é recurso do Pro/Master (o servidor nem envia o número dos demais).
        const whatsapp = selectedPartner.planTier !== "FREE" ? selectedPartner.whatsapp?.replace(/\D/g, "") || null : null;
        toast.success(`Pedido enviado para ${selectedPartner.companyName}.`, {
          description: "O fornecedor recebeu seus dados e vai entrar em contato.",
          action: whatsapp
            ? {
                label: "Conversar no WhatsApp",
                onClick: () =>
                  window.open(
                    `https://wa.me/${whatsapp}?text=${encodeURIComponent(
                      `Olá! Sou ${coupleName} e acabei de pedir um orçamento pelo Aceito${weddingDate ? ` para o casamento em ${new Date(weddingDate).toLocaleDateString("pt-BR")}` : ""}.`
                    )}`,
                    "_blank",
                    "noopener,noreferrer"
                  ),
              }
            : undefined,
        });
        setLeadModalOpen(false);
        // Reseta form
        setCoupleName("");
        setCouplePhone("");
        setCoupleEmail("");
        setGuestCount("");
        setLeadMessage("");
      } else {
        toast.error(res.error || "Erro ao enviar solicitação.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-paper text-tinta font-sans flex flex-col justify-between">
      <LandingHeader />

      <div className="flex-1 py-12 px-6 max-w-7xl mx-auto w-full space-y-10">
        {/* Banner Superior do Marketplace (Sem badge descasada) */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-4xl sm:text-5xl font-display text-tinta leading-tight">
            Os Melhores Fornecedores para o seu <span className="italic text-brand">Grande Dia</span>
          </h1>

          <p className="text-tinta-suave text-sm sm:text-base leading-relaxed">
            Profissionais verificados pela curadoria Aceito, com portfólio auditado, avaliações reais de casais e agenda aberta na sua região.
          </p>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="bg-papel p-6 rounded-3xl border border-linha shadow-sm space-y-5">
          {/* Busca por texto e Região */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-tinta-suave absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por espaço, fotógrafo, buffet ou estilo..."
                className="pl-11 rounded-2xl h-12 text-sm bg-linho/60 border-linha"
              />
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="filtro-data" className="sr-only">
                Data do casamento
              </Label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-brand absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <Input
                  id="filtro-data"
                  type="date"
                  min={todayIso}
                  value={dateInput}
                  onChange={(e) => applyDate(e.target.value)}
                  aria-describedby="filtro-data-dica"
                  title="Data do casamento"
                  className="pl-11 pr-10 rounded-2xl h-12 text-xs font-bold bg-linho/60 border-linha"
                />
                {isPendingDate ? (
                  <Loader2 className="w-4 h-4 animate-spin text-tinta-suave absolute right-4 top-1/2 -translate-y-1/2" aria-label="Atualizando" />
                ) : dateInput ? (
                  <button
                    type="button"
                    onClick={() => applyDate("")}
                    aria-label="Limpar data do casamento"
                    className="absolute right-2 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full text-tinta-suave hover:bg-areia hover:text-tinta"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              <p id="filtro-data-dica" className="sr-only">
                Data do casamento: mostra só fornecedores com a data livre.
              </p>
            </div>

            <div className="md:col-span-4">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger aria-label="Filtrar por região" className="rounded-2xl h-12 bg-linho/60 border-linha text-xs font-bold text-tinta">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand shrink-0" />
                    <SelectValue placeholder="Selecione a Região" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((reg) => (
                    <SelectItem key={reg} value={reg} className="text-xs font-medium">
                      📍 {reg === "TODAS" ? "Todas as Regiões" : reg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Categorias em Botões Roláveis */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide pt-2 border-t border-linha">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-brand text-white shadow-xs"
                      : "bg-areia/80 text-tinta-suave hover:bg-stone-200"
                  }`}
                >
                  {cat === "TODOS" ? "✨ Todas as Categorias" : cat}
                </button>
              );
            })}
          </div>

          {activeDate ? (
            <p role="status" className="text-xs font-semibold text-tinta-suave">
              Mostrando fornecedores com a data {formatIsoDate(activeDate)} livre na agenda.
            </p>
          ) : null}
        </div>

        {/* Em destaque: fornecedores Master */}
        {featuredPartners.length > 0 ? (
          <section aria-labelledby="em-destaque" className="space-y-3">
            <h2 id="em-destaque" className="flex items-center gap-2 text-xl font-display text-tinta">
              <Sparkles className="w-5 h-5 text-amber-700" aria-hidden="true" />
              Em destaque
            </h2>
            <ul className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-2 scrollbar-hide snap-x">
              {featuredPartners.map((partner) => (
                <li key={partner.id} className="w-64 shrink-0 snap-start">
                  <Link
                    href={`/fornecedores/${partner.id}`}
                    className="group block overflow-hidden rounded-3xl border border-brand/40 bg-papel shadow-xs ring-1 ring-brand/20 transition-shadow hover:shadow-lg"
                  >
                    <div className="relative h-32 w-full bg-areia">
                      {partner.coverUrl ? (
                        <UserImage src={partner.coverUrl} alt="" sizes="256px" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-300">
                          <Building2 className="w-10 h-10" aria-hidden="true" />
                        </div>
                      )}
                      <span className="absolute top-2 left-2 rounded-full bg-amber-700 px-2.5 py-1 text-xs font-extrabold text-white shadow-xs">
                        Destaque
                      </span>
                    </div>
                    <div className="space-y-1 p-4">
                      <p className="line-clamp-1 font-display text-lg text-tinta group-hover:text-brand">{partner.companyName}</p>
                      <p className="flex items-center justify-between gap-2 text-xs text-tinta-suave">
                        <span>{partner.category}</span>
                        {partner.reviewCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-tinta">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                            {partner.rating.toFixed(1)}
                            <span className="sr-only">de 5 estrelas</span>
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Lista de Fornecedores */}
        {filteredPartners.length === 0 ? (
          <div className="bg-papel p-12 rounded-3xl border border-linha text-center space-y-4">
            <Building2 className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-lg font-display text-tinta">Nenhum fornecedor encontrado</h3>
            <p className="text-xs text-tinta-suave max-w-md mx-auto">
              {activeDate
                ? "Nenhum fornecedor com esses filtros está livre nessa data. Tente outra data ou outros filtros."
                : "Tente alterar os filtros de região ou categoria para encontrar outros parceiros disponíveis."}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory("TODOS");
                setSelectedRegion("TODAS");
                setSearchTerm("");
                if (activeDate) applyDate("");
              }}
              className="rounded-full text-xs font-bold"
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPartners.map((partner, index) => {
              const regions = parseRegions(partner.serviceRegions);

              const isMaster = partner.planTier === "MASTER";

              return (
                <Reveal key={partner.id} delay={(index % 3) * 90} className="flex">
                <div
                  className={`bg-papel rounded-3xl overflow-hidden border transition-all flex w-full flex-col justify-between hover:shadow-xl group ${
                    isMaster
                      ? "border-brand/40 ring-1 ring-brand/20 shadow-md"
                      : "border-linha/90 shadow-xs"
                  }`}
                >
                  <div>
                    {/* Imagem de Capa com Link para Perfil */}
                    <Link href={`/fornecedores/${partner.id}`} className="block relative h-52 w-full bg-areia overflow-hidden">
                      {partner.coverUrl ? (
                        <UserImage
                          src={partner.coverUrl}
                          alt={partner.companyName}
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-areia text-stone-300">
                          <Building2 className="w-12 h-12" />
                        </div>
                      )}

                      {/* Badge Verificado / Master */}
                      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-1.5">
                        {partner.isVerified && (
                          <span className="bg-brand-50/95 backdrop-blur-md text-brand border border-brand/30 font-bold text-xs px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                            <span>Curadoria Aprovada</span>
                          </span>
                        )}
                        {isMaster && (
                          <span className="bg-amber-700 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-xs">
                            Destaque
                          </span>
                        )}
                      </div>

                      {/* Faixa de Preço & Categoria (embaixo da foto, para não disputar espaço com os selos) */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1">
                        {partner.priceRange && (
                          <span className="bg-black/60 backdrop-blur-md text-amber-300 text-xs font-semibold tracking-wider px-2 py-1 rounded-full">
                            {partner.priceRange}
                          </span>
                        )}
                        <span className="bg-stone-900/80 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          {partner.category}
                        </span>
                      </div>
                    </Link>

                    {/* Conteúdo */}
                    <div className="p-6 space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <Link href={`/fornecedores/${partner.id}`}>
                            <h3 className="font-display text-xl text-tinta group-hover:text-brand transition-colors line-clamp-1">
                              {partner.companyName}
                            </h3>
                          </Link>
                          {partner.rating && (
                            <div className="flex items-center gap-1 text-xs font-bold text-tinta-suave bg-linho px-2.5 py-1 rounded-xl border border-linha/60 shrink-0">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{partner.rating.toFixed(1)}</span>
                              <span className="text-xs text-tinta-suave font-normal">
                                ({partner.reviewCount || 0})
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-tinta-suave mt-2 line-clamp-2 leading-relaxed">
                          {partner.description}
                        </p>
                      </div>

                      {/* Tags de Regiões de Atendimento */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-tinta-suave block">
                          Regiões Atendidas:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {regions.slice(0, 3).map((r, i) => (
                            <span
                              key={i}
                              className="text-xs bg-areia text-tinta-suave px-2.5 py-0.5 rounded-full font-medium"
                            >
                              📍 {r}
                            </span>
                          ))}
                          {regions.length > 3 && (
                            <span className="text-xs text-tinta-suave font-bold px-1 py-0.5">
                              +{regions.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Recursos de Atendimento */}
                      <div className="flex items-center gap-4 text-xs text-tinta-suave pt-2 border-t border-linha">
                        {partner.offersOnlineMeet && (
                          <div className="flex items-center gap-1 text-sucesso font-bold text-xs">
                            <Video className="w-3.5 h-3.5" />
                            <span>Reunião Online</span>
                          </div>
                        )}
                        {partner.hasPhysicalSpace && (
                          <div className="flex items-center gap-1 text-tinta-suave text-xs">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Showroom Presencial</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Card com Preço e Ações */}
                  <div className="p-6 pt-0 space-y-3">
                    {partner.startingPrice && partner.startingPrice > 0 && (
                      <div className="flex items-baseline justify-between text-xs pt-3 border-t border-linha">
                        <span className="text-tinta-suave font-medium">A partir de:</span>
                        <span className="font-extrabold text-base text-tinta">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(partner.startingPrice / 100)}
                        </span>
                      </div>
                    )}

                    {/* Ação principal: pedido de orçamento (registra o contato do casal) */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" className="w-full rounded-2xl h-11 text-sm font-semibold border-linha gap-1.5">
                        <Link href={`/fornecedores/${partner.id}`}>
                          <ImageIcon className="w-4 h-4" aria-hidden="true" />
                          Ver perfil
                        </Link>
                      </Button>
                      <Button
                        onClick={() => handleOpenLeadModal(partner)}
                        className="w-full rounded-2xl h-11 text-sm font-semibold bg-brand hover:bg-brand-600 text-white shadow-xs gap-1.5"
                      >
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        Pedir orçamento
                      </Button>
                    </div>
                  </div>
                </div>
                </Reveal>
              );
            })}
          </div>
        )}

        {/* Banner CTA para Novos Fornecedores (Sem badge descasada) */}
        <section className="mt-16 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 border border-stone-800">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-display text-stone-100">
              Você é Fornecedor de Casamento?
            </h2>
            <p className="text-xs sm:text-sm text-stone-300/90 leading-relaxed">
              Destaque seu negócio para casais com data marcada e orçamento definido na sua região. Receba solicitações de orçamento e agendamentos diretos após nossa curadoria de qualidade.
            </p>
          </div>

          <Link href="/cadastro?tipo=fornecedor&plano=pro" className="shrink-0">
            <Button className="bg-brand hover:bg-brand-600 text-white rounded-full font-bold h-14 px-8 text-sm shadow-md gap-2 cursor-pointer">
              <span>Cadastrar Minha Empresa</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </section>
      </div>

      {/* Modal de Agendamento de Reunião e Orçamento */}
      <Dialog open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <DialogContent className="sm:max-w-md bg-papel rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-tinta">
              Solicitar Orçamento & Reunião
            </DialogTitle>
            <p className="text-xs text-tinta-suave mt-1">
              Conecte-se diretamente com <strong>{selectedPartner?.companyName}</strong>.
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmitLead} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-tinta-suave uppercase">Seu Nome / Casal</Label>
              <Input
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                placeholder="Ex: Giovanna & Lucas"
                required
                className="rounded-2xl h-11 text-xs bg-linho"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-tinta-suave uppercase">WhatsApp</Label>
                <Input
                  value={couplePhone}
                  onChange={(e) => setCouplePhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                  className="rounded-2xl h-11 text-xs bg-linho font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-tinta-suave uppercase">E-mail</Label>
                <Input
                  type="email"
                  value={coupleEmail}
                  onChange={(e) => setCoupleEmail(e.target.value)}
                  placeholder="noivos@email.com"
                  className="rounded-2xl h-11 text-xs bg-linho"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-tinta-suave uppercase">Qtd. Convidados</Label>
                <Input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  placeholder="Ex: 150"
                  className="rounded-2xl h-11 text-xs bg-linho font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-tinta-suave uppercase">Data Prevista</Label>
                <DatePicker
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  placeholder="Selecione a data"
                  className="rounded-2xl h-11 text-xs bg-linho"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-tinta-suave uppercase">Preferência de Reunião</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMeetingType("ONLINE")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    meetingType === "ONLINE"
                      ? "bg-brand-50 border-brand text-brand"
                      : "bg-linho border-linha text-tinta-suave"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Google Meet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMeetingType("PRESENTIAL")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
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

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-tinta-suave uppercase">Mensagem Adicional</Label>
              <Textarea
                value={leadMessage}
                onChange={(e) => setLeadMessage(e.target.value)}
                placeholder="Conte um pouco sobre o estilo do casamento ou dúvidas específicas..."
                className="rounded-2xl text-xs bg-linho resize-none h-20"
              />
            </div>

            <Button
              type="submit"
              disabled={isPendingLead}
              className="w-full bg-brand hover:bg-brand-600 text-white rounded-full font-bold h-12 text-xs shadow-md gap-2 mt-2"
            >
              {isPendingLead ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Enviar Solicitação de Reunião</span>
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <LandingFooter />
    </div>
  );
}
