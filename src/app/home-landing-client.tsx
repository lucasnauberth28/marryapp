"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Gift,
  MessageCircle,
  QrCode,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Clock,
  Compass,
  Check,
  CreditCard,
  Building2,
  Sliders,
  Send,
  Star,
  Zap,
  Percent,
  Lock,
  Heart,
  ChevronDown,
  Camera,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WeddingRingsIcon } from "@/components/icons/wedding-rings";
import { PlanCalculator } from "@/components/pricing/plan-calculator";
import { FaqSection } from "@/components/landing/faq-section";
import { LandingFooter } from "@/components/landing/landing-footer";

type AudienceType = "NOIVOS" | "ASSESSORES" | "FORNECEDORES";
type PricingAudience = "COUPLE" | "VENDOR";

export function HomeLandingClient() {
  const [activeTab, setActiveTab] = useState<AudienceType>("NOIVOS");
  const [pricingType, setPricingType] = useState<PricingAudience>("COUPLE");
  const [detailedPricingType, setDetailedPricingType] = useState<PricingAudience>("COUPLE");

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-stone-900 font-sans antialiased overflow-x-hidden selection:bg-[#8C6D45]/20 selection:text-[#8C6D45]">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR GLOBAL COM LOGOTIPO DE ALIANÇAS (SEM A PALAVRA ECOSYSTEM) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#FCFBF9]/85 backdrop-blur-md border-b border-stone-200/60 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo MarryApp com Alianças Juntas */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FAF4ED] to-[#FAF8F5] border border-[#8C6D45]/30 flex items-center justify-center text-[#8C6D45] shadow-xs group-hover:scale-105 transition-transform">
              <WeddingRingsIcon className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif italic font-bold text-2xl text-stone-900 leading-none">
                MarryApp
              </span>
              <span className="text-[9px] tracking-widest text-[#8C6D45] font-extrabold uppercase mt-0.5">
                Plataforma Oficial
              </span>
            </div>
          </Link>

          {/* Navegação por Públicos */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100/80 p-1.5 rounded-full border border-stone-200/60">
            <button
              onClick={() => setActiveTab("NOIVOS")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "NOIVOS"
                  ? "bg-white text-[#8C6D45] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              💍 Para Noivos
            </button>
            <button
              onClick={() => setActiveTab("ASSESSORES")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "ASSESSORES"
                  ? "bg-white text-[#8C6D45] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              📋 Para Assessores
            </button>
            <button
              onClick={() => setActiveTab("FORNECEDORES")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === "FORNECEDORES"
                  ? "bg-white text-[#8C6D45] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              🤝 Para Fornecedores
            </button>
          </nav>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-xs font-bold text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-full px-4 h-10"
              >
                Entrar
              </Button>
            </Link>
            <Link href="/assinar?tipo=casal&plano=classic">
              <Button className="bg-[#8C6D45] hover:bg-[#785c39] text-white text-xs font-bold rounded-full px-5 h-10 shadow-sm hover:shadow-md transition-all gap-1.5">
                <span>Criar Casamento</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO DINÂMICO COM SLOGAN OFICIAL: "O casamento dos seus sonhos, organizado e fácil!" */}
      {/* ========================================================================= */}
      <section className="relative pt-16 pb-16 md:pt-20 md:pb-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-gradient-to-tr from-[#8C6D45]/10 via-[#C5A880]/15 to-amber-100/30 blur-3xl -z-10 pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-6">
          {/* Seletor Mobile de Públicos */}
          <div className="flex md:hidden justify-center mb-8">
            <div className="inline-flex bg-stone-100 p-1 rounded-full border border-stone-200">
              <button
                onClick={() => setActiveTab("NOIVOS")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  activeTab === "NOIVOS" ? "bg-white text-[#8C6D45] shadow-xs" : "text-stone-500"
                }`}
              >
                Noivos
              </button>
              <button
                onClick={() => setActiveTab("ASSESSORES")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  activeTab === "ASSESSORES" ? "bg-white text-[#8C6D45] shadow-xs" : "text-stone-500"
                }`}
              >
                Assessores
              </button>
              <button
                onClick={() => setActiveTab("FORNECEDORES")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  activeTab === "FORNECEDORES" ? "bg-white text-[#8C6D45] shadow-xs" : "text-stone-500"
                }`}
              >
                Fornecedores
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* 💍 ABA NOIVOS */}
            {activeTab === "NOIVOS" && (
              <motion.div
                key="noivos"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center text-center max-w-4xl mx-auto"
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-stone-900 tracking-tight leading-[1.1] font-serif">
                  O casamento dos seus sonhos,{" "}
                  <span className="italic text-[#8C6D45]">organizado e fácil!</span>
                </h1>

                <p className="mt-6 text-base sm:text-lg md:text-xl text-stone-600 max-w-2xl leading-relaxed">
                  Crie o site do casal em minutos com construtor no-code, receba presentes em dinheiro via Pix com taxa zero no Classic e automatize confirmações de presença pelo WhatsApp.
                </p>

                {/* Métricas Noivos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-10 border-t border-stone-200/80 w-full text-left">
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">0% de Taxa</p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">no Pix Direto do Plano Classic</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">100%</p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">Automatizado no WhatsApp</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">No-Code</p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">Construtor Visual de Seções</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">12x</p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">Parcelamento no Cartão</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 📋 ABA ASSESSORES */}
            {activeTab === "ASSESSORES" && (
              <motion.div
                key="assessores"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center text-center max-w-4xl mx-auto"
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-stone-900 tracking-tight leading-[1.1] font-serif">
                  Gerencie todos os seus casamentos{" "}
                  <span className="italic text-[#8C6D45]">sem planilhas perdidas</span>.
                </h1>

                <p className="mt-6 text-base sm:text-lg md:text-xl text-stone-600 max-w-2xl leading-relaxed">
                  Controle múltiplos eventos simultâneos, checklist inteligente de 365 dias, mapa de mesas interativo e relatórios de buffet com exportação em 1 clique.
                </p>

                {/* Métricas Assessores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-10 border-t border-stone-200/80 w-full text-left">
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">Multi-Eventos</p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">Painel único consolidado</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">365 Dias</p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">Checklist cronológico guiado</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">PDF & Excel</p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">Relatórios para o Buffet</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">QR Check-in</p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">Credenciamento na recepção</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 🤝 ABA FORNECEDORES */}
            {activeTab === "FORNECEDORES" && (
              <motion.div
                key="fornecedores"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center text-center max-w-4xl mx-auto"
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-stone-900 tracking-tight leading-[1.1] font-serif">
                  Conecte-se com casais reais prontos para contratar{" "}
                  <span className="italic text-[#8C6D45]">na sua região</span>.
                </h1>

                <p className="mt-6 text-base sm:text-lg md:text-xl text-stone-600 max-w-2xl leading-relaxed">
                  Defina seu raio de atendimento e entrega, agende reuniões online ou presenciais e feche novos contratos com noivos de alto poder aquisitivo.
                </p>

                {/* Métricas Fornecedores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-10 border-t border-stone-200/80 w-full text-left">
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">Geolocalizado</p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">Filtro por raio de entrega</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">Reuniões</p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">Online e Presenciais</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">Leads Reais</p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">Noivos com data e local</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">Selo Pro</p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">Fornecedor Verificado</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. GALERIA VISUAL LUXUOSA DE CASAMENTOS & EXPERIÊNCIA DO SISTEMA */}
      {/* ========================================================================= */}
      <section className="py-16 bg-[#F7F5F0] border-y border-stone-200/60">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C6D45]">
              Design & Sofisticação
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-serif text-stone-900">
              Uma Experiência Visual Inesquecível
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              Do convite no WhatsApp ao brinde na festa, encante cada convidado com tecnologia fluida e estética impecável.
            </p>
          </div>

          {/* Grid de Imagens de Casamento & Mockups Vivos (SEM BORDAS PRETAS) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Foto 1: Casal / Altar Principal */}
            <div className="md:col-span-7 relative isolate rounded-3xl overflow-hidden shadow-xl group min-h-[420px] flex flex-col justify-end p-8 bg-stone-900">
              <img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80"
                alt="Casamento dos Sonhos"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/50 to-stone-950/10 z-10" />

              <div className="relative z-20 space-y-3 text-white">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#8C6D45] text-white font-bold text-[10px] uppercase tracking-wider shadow-xs">
                    Site dos Noivos No-Code
                  </Badge>
                  <span className="text-[11px] font-mono text-stone-300 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
                    marryapp.com.br/casamento/...
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold leading-tight">
                  Sua história contada com elegância cinematográfica
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 max-w-lg leading-relaxed">
                  Compartilhe capítulos do casal, mapa integrado com Waze/Uber, guia de trajes com paleta de cores recomendada e mural de recados interativo com fotos.
                </p>
              </div>
            </div>

            {/* Coluna Direita: 2 Cards Visuais Menores */}
            <div className="md:col-span-5 grid grid-cols-1 gap-6">
              {/* Foto 2: Recepção & Mesas */}
              <div className="relative isolate rounded-3xl overflow-hidden shadow-lg group min-h-[200px] flex flex-col justify-end p-6 bg-stone-900">
                <img
                  src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80"
                  alt="Decoração e Recepção"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent z-10" />

                <div className="relative z-20 text-white space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-amber-300 font-extrabold flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Recepção & Mesas</span>
                  </span>
                  <h4 className="text-lg font-serif font-bold leading-snug">
                    Gestão visual de assentos e restrições de buffet
                  </h4>
                  <p className="text-[11px] text-stone-300">
                    Organize convidados por setor com exportação instantânea para cerimonialistas.
                  </p>
                </div>
              </div>

              {/* Foto 3: Brinde & Alianças */}
              <div className="relative isolate rounded-3xl overflow-hidden shadow-lg group min-h-[200px] flex flex-col justify-end p-6 bg-stone-900">
                <img
                  src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80"
                  alt="Celebração e Presentes"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent z-10" />

                <div className="relative z-20 text-white space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-extrabold flex items-center gap-1.5">
                    <Gift className="w-3 h-3" />
                    <span>Lista de Presentes Pix</span>
                  </span>
                  <h4 className="text-lg font-serif font-bold leading-snug">
                    Receba em dinheiro com taxa zero e resgate no mesmo dia
                  </h4>
                  <p className="text-[11px] text-stone-300">
                    Presentes fictícios convertidos em Pix direto na conta bancária dos noivos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SHOWCASE DOS PILARES (3 CARDS COM DESTAQUE DE TAXA ZERO NO PIX) */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white border-y border-stone-200/70">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-[#8C6D45] uppercase tracking-widest">
              Tecnologia de Ponta a Ponta
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-serif mt-2">
              Tudo o que você precisa para uma celebração impecável
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Pix e Cartão com Taxa Zero no Classic */}
            <div className="p-8 rounded-3xl bg-[#FAF8F5] border border-stone-200/80 hover:border-[#8C6D45]/40 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#8C6D45]/10 text-[#8C6D45] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Percent className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 font-serif mb-2">
                  Pix & Cartão sem Taxa no Classic
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  No plano básico cobramos uma pequena taxa de 2,99% por presente. Já no Plano Classic e VIP, a taxa é <strong>ZERO 0% no Pix</strong> com saque direto na sua conta bancária no mesmo dia.
                </p>
              </div>
              <Link href="/assinar?tipo=casal&plano=classic" className="mt-6 pt-4 border-t border-stone-200/60 flex items-center text-xs font-bold text-[#8C6D45] gap-1 group-hover:gap-2 transition-all">
                <span>Ver Planos sem Taxa</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Card 2: WhatsApp & RSVP Inteligente */}
            <div className="p-8 rounded-3xl bg-[#FAF8F5] border border-stone-200/80 hover:border-[#8C6D45]/40 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 font-serif mb-2">
                  Automação WhatsApp & RSVP
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Envie convites oficiais e lembretes automáticos com botões interativos direto no WhatsApp do convidado. Confirmação instantânea sem estresse.
                </p>
              </div>
              <Link href="/mensagens" className="mt-6 pt-4 border-t border-stone-200/60 flex items-center text-xs font-bold text-emerald-700 gap-1 group-hover:gap-2 transition-all">
                <span>Ver Automações</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Card 3: Fornecedores por Região */}
            <div className="p-8 rounded-3xl bg-[#FAF8F5] border border-stone-200/80 hover:border-[#8C6D45]/40 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 font-serif mb-2">
                  Marketplace de Fornecedores
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Encontre e contrate fornecedores verificados que atendem exatamente a sua cidade e agende reuniões online ou presenciais com agenda integrada.
                </p>
              </div>
              <Link href="/fornecedores" className="mt-6 pt-4 border-t border-stone-200/60 flex items-center text-xs font-bold text-blue-700 gap-1 group-hover:gap-2 transition-all">
                <span>Explorar Fornecedores</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SELEÇÃO DE PLANOS COM CORTE DIAGONAL INTERATIVO */}
      {/* ========================================================================= */}
      <section className="py-24 max-w-7xl mx-auto px-6" id="planos">
        {/* Cabeçalho Limpo (Sem a badge de transparência total) */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-serif">
            {pricingType === "COUPLE" ? "Planos para o seu Casamento" : "Planos para Empresas de Eventos"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-2">
            {pricingType === "COUPLE"
              ? "Escolha o pacote ideal para o seu grande dia ou monte uma combinação personalizada."
              : "Destaque sua empresa e receba pedidos de noivos qualificados na sua região de atendimento."}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* SELETOR COM IMAGENS E CORTE DIAGONAL ("VOU ME CASAR" vs "FORNEÇO SERVIÇOS") */}
        {/* ========================================================================= */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden shadow-xl bg-stone-950 relative border border-stone-800">
            {/* Lado 1: Vou me casar (Corte Diagonal Esquerda) */}
            <button
              type="button"
              onClick={() => setPricingType("COUPLE")}
              className={`group relative h-48 md:h-56 flex flex-col justify-end p-8 text-left transition-all duration-300 overflow-hidden cursor-pointer ${
                pricingType === "COUPLE"
                  ? "ring-2 ring-inset ring-[#8C6D45] md:z-10 opacity-100"
                  : "opacity-60 hover:opacity-85"
              }`}
              style={{
                clipPath: "polygon(0 0, 100% 0, 96% 100%, 0% 100%)",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80"
                alt="Vou me casar"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 -z-10 opacity-40"
              />
              <div
                className={`absolute inset-0 transition-opacity duration-300 -z-10 ${
                  pricingType === "COUPLE"
                    ? "bg-gradient-to-t from-stone-950 via-stone-950/75 to-stone-950/30"
                    : "bg-stone-950/85 group-hover:bg-stone-950/70"
                }`}
              />
              <div className="relative z-10 text-white space-y-1.5">
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
                  💍 Vou me casar
                </h3>
                <p className="text-xs text-stone-300/90 leading-relaxed max-w-sm">
                  Site personalizado, lista com Pix taxa zero e convites no WhatsApp.
                </p>
              </div>
            </button>

            {/* Lado 2: Forneço serviços (Corte Diagonal Direita) */}
            <button
              type="button"
              onClick={() => setPricingType("VENDOR")}
              className={`group relative h-48 md:h-56 flex flex-col justify-end p-8 text-left transition-all duration-300 overflow-hidden cursor-pointer ${
                pricingType === "VENDOR"
                  ? "ring-2 ring-inset ring-[#8C6D45] md:z-10 opacity-100"
                  : "opacity-60 hover:opacity-85"
              }`}
              style={{
                clipPath: "polygon(4% 0, 100% 0, 100% 100%, 0% 100%)",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80"
                alt="Forneço serviços"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 -z-10 opacity-30"
              />
              <div
                className={`absolute inset-0 transition-opacity duration-300 -z-10 ${
                  pricingType === "VENDOR"
                    ? "bg-gradient-to-t from-stone-950 via-stone-950/80 to-stone-950/40"
                    : "bg-stone-950/90 group-hover:bg-stone-950/75"
                }`}
              />
              <div className="relative z-10 text-white space-y-1.5">
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100">
                  🤝 Forneço serviços
                </h3>
                <p className="text-xs text-stone-300/90 leading-relaxed max-w-sm">
                  Receba pedidos de orçamentos e agendamentos de reuniões com noivos.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 💍 SELEÇÃO DE PLANOS PARA CASAIS (3 CARDS + LINK PARA MONTAR PLANO) */}
        {pricingType === "COUPLE" && (
          <PlanCalculator />
        )}

        {/* 🤝 3 PLANOS PARA FORNECEDORES */}
        {pricingType === "VENDOR" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* 1. Fornecedor Start */}
            <div className="bg-white p-7 rounded-3xl border border-stone-200 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-all">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Iniciante</span>
                <h3 className="text-xl font-bold font-serif text-stone-900 mt-1">Fornecedor Start</h3>
                <p className="text-xs text-stone-500 mt-1">Perfil básico no marketplace.</p>

                <div className="my-6">
                  <span className="text-3xl font-extrabold text-stone-900">Grátis</span>
                  <span className="text-xs text-stone-400 font-medium"> / para sempre</span>
                </div>

                <ul className="space-y-2.5 text-xs text-stone-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Perfil no Marketplace</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>1 região de atendimento</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Até 3 solicitações de orçamento/mês</span>
                  </li>
                </ul>
              </div>

              <Link href="/assinar?tipo=fornecedor&plano=start" className="mt-8">
                <Button variant="outline" className="w-full rounded-full font-bold h-12 text-xs border-stone-300">
                  Cadastrar Empresa Grátis
                </Button>
              </Link>
            </div>

            {/* 2. Fornecedor Pro (DESTAQUE COM BADGE CENTRALIZADA) */}
            <div className="bg-gradient-to-b from-emerald-50/50 to-white p-7 rounded-3xl border-2 border-emerald-600 shadow-lg flex flex-col justify-between relative hover:shadow-xl transition-all">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-max bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-4 py-1 rounded-full shadow-xs text-center">
                Mais Popular para Empresas
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">Destaque Comercial</span>
                <h3 className="text-xl font-bold font-serif text-stone-900 mt-1">Fornecedor Pro</h3>
                <p className="text-xs text-stone-500 mt-1">Leads ilimitados e selo verificado.</p>

                <div className="my-6">
                  <span className="text-xs text-stone-400 font-bold">R$ </span>
                  <span className="text-3xl font-extrabold text-stone-900">99</span>
                  <span className="text-xs text-stone-400 font-medium"> / mês</span>
                </div>

                <ul className="space-y-2.5 text-xs text-stone-700 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Selo de Fornecedor Verificado</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Múltiplas regiões e cidades</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Leads e orçamentos ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Agendamento de reuniões online/presencial</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Botão de WhatsApp direto com o casal</span>
                  </li>
                </ul>
              </div>

              <Link href="/assinar?tipo=fornecedor&plano=pro" className="mt-8">
                <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-full font-bold h-12 text-xs shadow-md">
                  Assinar Plano Pro
                </Button>
              </Link>
            </div>

            {/* 3. Fornecedor Master Elite */}
            <div className="bg-white p-7 rounded-3xl border border-stone-200 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-all">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-700 tracking-wider">Alta Performance</span>
                <h3 className="text-xl font-bold font-serif text-stone-900 mt-1">Fornecedor Master</h3>
                <p className="text-xs text-stone-500 mt-1">Topo das buscas e analytics.</p>

                <div className="my-6">
                  <span className="text-xs text-stone-400 font-bold">R$ </span>
                  <span className="text-3xl font-extrabold text-stone-900">249</span>
                  <span className="text-xs text-stone-400 font-medium"> / mês</span>
                </div>

                <ul className="space-y-2.5 text-xs text-stone-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Topo das buscas na sua categoria</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Banner de destaque na sua região</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Painel de Analytics de visualizações</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Envio de propostas e contratos digitais</span>
                  </li>
                </ul>
              </div>

              <Link href="/assinar?tipo=fornecedor&plano=master" className="mt-8">
                <Button variant="outline" className="w-full rounded-full font-bold h-12 text-xs border-blue-600 text-blue-700 hover:bg-blue-50">
                  Assinar Plano Master
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. BANNER CTA LUXUOSO COM IMAGEM DE FUNDO SUAVIZADA NO TOM ESCURO */}
      {/* ========================================================================= */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="relative isolate overflow-hidden rounded-3xl bg-stone-950 text-white p-10 sm:p-16 border border-stone-800 shadow-2xl">
          {/* Imagem de Fundo Suavizada Horizontalmente */}
          <img
            src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80"
            alt="Celebração Inesquecível"
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/75 to-stone-950/95 z-10" />

          {/* Brilhos Sutis Dourados */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#8C6D45]/15 blur-3xl z-10 pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#C5A880]/10 blur-3xl z-10 pointer-events-none rounded-full" />

          <div className="relative z-20 max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-serif leading-tight">
              Pronto para viver o casamento mais <span className="italic text-[#C5A880]">inesquecível</span> da sua vida?
            </h2>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Junte-se aos casais e profissionais que já transformaram a organização do casamento em um momento leve, seguro e sofisticado.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/assinar?tipo=casal&plano=classic">
                <Button className="w-full sm:w-auto bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold h-14 px-8 text-sm shadow-xl hover:scale-105 transition-all gap-2 cursor-pointer">
                  <span>Criar Meu Casamento Agora</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <Link href="/fornecedores">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto rounded-full font-bold h-14 px-8 text-sm border-stone-700 bg-white/5 text-stone-200 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  Explorar Fornecedores
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-stone-400 border-t border-stone-800/80">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ativação Instantânea</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>0% de Taxa no Pix (Classic)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Suporte Humanizado</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FAQ & FOOTER */}
      {/* ========================================================================= */}
      <FaqSection />
      <LandingFooter />
    </div>
  );
}
