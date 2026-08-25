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
  MessageCircle,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Search,
  ArrowRight,
  Loader2,
  Users,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { createVendorLead } from "@/actions/partner-vendor-actions";
import { toast } from "sonner";

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
  initialPartners: any[];
}

export function PublicVendorsView({ initialPartners }: PublicVendorsViewProps) {
  const [partners, setPartners] = useState<any[]>(initialPartners);
  const [selectedCategory, setSelectedCategory] = useState("TODOS");
  const [selectedRegion, setSelectedRegion] = useState("TODAS");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal de Agendamento de Reunião & Lead
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
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
      try {
        const regions: string[] = JSON.parse(p.serviceRegions || "[]");
        matchesRegion = regions.includes(selectedRegion) || regions.includes("Brasil Todo");
      } catch {
        matchesRegion = true;
      }
    }

    const matchesSearch =
      !searchTerm ||
      p.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesRegion && matchesSearch;
  });

  const handleOpenLeadModal = (partner: any) => {
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
        toast.success(`Solicitação enviada com sucesso para ${selectedPartner.companyName}! ✨`);
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
    <div className="min-h-screen bg-[#FCFBF9] text-stone-900 font-sans flex flex-col justify-between">
      <LandingHeader />

      <main className="flex-1 py-12 px-6 max-w-7xl mx-auto w-full space-y-10">
        {/* Banner Superior do Marketplace (Sem badge descasada) */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold font-serif text-stone-900 leading-tight">
            Os Melhores Fornecedores para o seu <span className="italic text-[#8C6D45]">Grande Dia</span>
          </h1>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            Profissionais verificados pela curadoria MarryApp, com portfólio auditado, avaliações reais de casais e agenda aberta na sua região.
          </p>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-5">
          {/* Busca por texto e Região */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por espaço, fotógrafo, buffet ou estilo..."
                className="pl-11 rounded-2xl h-12 text-sm bg-stone-50/60 border-stone-200"
              />
            </div>

            <div className="md:col-span-4">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="rounded-2xl h-12 bg-stone-50/60 border-stone-200 text-xs font-bold text-stone-800">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#8C6D45] shrink-0" />
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
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide pt-2 border-t border-stone-100">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#8C6D45] text-white shadow-xs"
                      : "bg-stone-100/80 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {cat === "TODOS" ? "✨ Todas as Categorias" : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Fornecedores */}
        {filteredPartners.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-4">
            <Building2 className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-lg font-bold font-serif text-stone-800">Nenhum fornecedor encontrado</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Tente alterar os filtros de região ou categoria para encontrar outros parceiros disponíveis.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory("TODOS");
                setSelectedRegion("TODAS");
                setSearchTerm("");
              }}
              className="rounded-full text-xs font-bold"
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPartners.map((partner) => {
              let regions: string[] = [];
              try {
                regions = JSON.parse(partner.serviceRegions || "[]");
              } catch {
                regions = [];
              }

              const isMaster = partner.planTier === "MASTER";

              return (
                <div
                  key={partner.id}
                  className={`bg-white rounded-3xl overflow-hidden border transition-all flex flex-col justify-between hover:shadow-xl group ${
                    isMaster
                      ? "border-[#8C6D45]/40 ring-1 ring-[#8C6D45]/20 shadow-md"
                      : "border-stone-200/90 shadow-xs"
                  }`}
                >
                  <div>
                    {/* Imagem de Capa com Link para Perfil */}
                    <Link href={`/fornecedores/${partner.id}`} className="block relative h-52 w-full bg-stone-100 overflow-hidden">
                      {partner.coverUrl ? (
                        <img
                          src={partner.coverUrl}
                          alt={partner.companyName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-300">
                          <Building2 className="w-12 h-12" />
                        </div>
                      )}

                      {/* Badge Verificado / Master */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        {partner.isVerified && (
                          <span className="bg-[#FAF4ED]/95 backdrop-blur-md text-[#8C6D45] border border-[#8C6D45]/30 font-bold text-[10px] px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#8C6D45]" />
                            <span>Curadoria Aprovada</span>
                          </span>
                        )}
                        {isMaster && (
                          <span className="bg-amber-700 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-xs">
                            ⭐ Destaque
                          </span>
                        )}
                      </div>

                      {/* Faixa de Preço & Categoria */}
                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        {partner.priceRange && (
                          <span className="bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-mono font-bold px-2 py-1 rounded-full">
                            {partner.priceRange}
                          </span>
                        )}
                        <span className="bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {partner.category}
                        </span>
                      </div>
                    </Link>

                    {/* Conteúdo */}
                    <div className="p-6 space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <Link href={`/fornecedores/${partner.id}`}>
                            <h3 className="font-serif font-bold text-xl text-stone-900 group-hover:text-[#8C6D45] transition-colors line-clamp-1">
                              {partner.companyName}
                            </h3>
                          </Link>
                          {partner.rating && (
                            <div className="flex items-center gap-1 text-xs font-bold text-stone-700 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200/60 shrink-0">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{partner.rating.toFixed(1)}</span>
                              <span className="text-[10px] text-stone-400 font-normal">
                                ({partner.reviewCount || 0})
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                          {partner.description}
                        </p>
                      </div>

                      {/* Tags de Regiões de Atendimento */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                          Regiões Atendidas:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {regions.slice(0, 3).map((r, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full font-medium"
                            >
                              📍 {r}
                            </span>
                          ))}
                          {regions.length > 3 && (
                            <span className="text-[10px] text-stone-400 font-bold px-1 py-0.5">
                              +{regions.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Recursos de Atendimento */}
                      <div className="flex items-center gap-4 text-xs text-stone-600 pt-2 border-t border-stone-100">
                        {partner.offersOnlineMeet && (
                          <div className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                            <Video className="w-3.5 h-3.5" />
                            <span>Reunião Online</span>
                          </div>
                        )}
                        {partner.hasPhysicalSpace && (
                          <div className="flex items-center gap-1 text-stone-600 text-[11px]">
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
                      <div className="flex items-baseline justify-between text-xs pt-3 border-t border-stone-100">
                        <span className="text-stone-400 font-medium">A partir de:</span>
                        <span className="font-extrabold text-base text-stone-900">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(partner.startingPrice / 100)}
                        </span>
                      </div>
                    )}

                    {/* Botão Ver Perfil Completo */}
                    <Link href={`/fornecedores/${partner.id}`} className="block">
                      <Button
                        variant="outline"
                        className="w-full rounded-2xl h-11 text-xs font-bold border-stone-300 hover:bg-[#FAF4ED] hover:text-[#8C6D45] hover:border-[#8C6D45]/40 transition-colors gap-1.5"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>Ver Perfil & Portfólio</span>
                      </Button>
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      {partner.whatsapp && (
                        <a
                          href={`https://wa.me/${partner.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Olá! Vi o perfil de vocês no MarryApp e gostaria de solicitar informações para o meu casamento.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full"
                        >
                          <Button
                            variant="outline"
                            className="w-full rounded-2xl h-11 text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1.5"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>WhatsApp</span>
                          </Button>
                        </a>
                      )}

                      <Button
                        onClick={() => handleOpenLeadModal(partner)}
                        className={`w-full rounded-2xl h-11 text-xs font-bold bg-[#8C6D45] hover:bg-[#785c39] text-white shadow-xs gap-1.5 ${
                          !partner.whatsapp ? "col-span-2" : ""
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Agendar Reunião</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Banner CTA para Novos Fornecedores (Sem badge descasada) */}
        <section className="mt-16 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 border border-stone-800">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-100">
              Você é Fornecedor de Casamento?
            </h2>
            <p className="text-xs sm:text-sm text-stone-300/90 leading-relaxed">
              Destaque seu negócio para casais com data marcada e orçamento definido na sua região. Receba solicitações de orçamento e agendamentos diretos após nossa curadoria de qualidade.
            </p>
          </div>

          <Link href="/assinar?tipo=fornecedor&plano=pro" className="shrink-0">
            <Button className="bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold h-14 px-8 text-sm shadow-md gap-2 cursor-pointer">
              <span>Cadastrar Minha Empresa</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </section>
      </main>

      {/* Modal de Agendamento de Reunião e Orçamento */}
      <Dialog open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-stone-900">
              Solicitar Orçamento & Reunião
            </DialogTitle>
            <p className="text-xs text-stone-500 mt-1">
              Conecte-se diretamente com <strong>{selectedPartner?.companyName}</strong>.
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmitLead} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-700 uppercase">Seu Nome / Casal</Label>
              <Input
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                placeholder="Ex: Giovanna & Lucas"
                required
                className="rounded-2xl h-11 text-xs bg-stone-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-700 uppercase">WhatsApp</Label>
                <Input
                  value={couplePhone}
                  onChange={(e) => setCouplePhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                  className="rounded-2xl h-11 text-xs bg-stone-50 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-700 uppercase">E-mail</Label>
                <Input
                  type="email"
                  value={coupleEmail}
                  onChange={(e) => setCoupleEmail(e.target.value)}
                  placeholder="noivos@email.com"
                  className="rounded-2xl h-11 text-xs bg-stone-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-700 uppercase">Qtd. Convidados</Label>
                <Input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  placeholder="Ex: 150"
                  className="rounded-2xl h-11 text-xs bg-stone-50 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-700 uppercase">Data Prevista</Label>
                <DatePicker
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  placeholder="Selecione a data"
                  className="rounded-2xl h-11 text-xs bg-stone-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-700 uppercase">Preferência de Reunião</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMeetingType("ONLINE")}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    meetingType === "ONLINE"
                      ? "bg-[#FAF4ED] border-[#8C6D45] text-[#8C6D45]"
                      : "bg-stone-50 border-stone-200 text-stone-600"
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
                      ? "bg-[#FAF4ED] border-[#8C6D45] text-[#8C6D45]"
                      : "bg-stone-50 border-stone-200 text-stone-600"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Presencial</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-700 uppercase">Mensagem Adicional</Label>
              <Textarea
                value={leadMessage}
                onChange={(e) => setLeadMessage(e.target.value)}
                placeholder="Conte um pouco sobre o estilo do casamento ou dúvidas específicas..."
                className="rounded-2xl text-xs bg-stone-50 resize-none h-20"
              />
            </div>

            <Button
              type="submit"
              disabled={isPendingLead}
              className="w-full bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold h-12 text-xs shadow-md gap-2 mt-2"
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
