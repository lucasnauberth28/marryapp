"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
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
  Laptop,
  Compass,
  Check,
  TrendingUp,
  CreditCard,
  ChevronDown,
  Building2,
  UserCheck,
  Sliders,
  Send,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AudienceType = "NOIVOS" | "ASSESSORES" | "FORNECEDORES";

export function HomeLandingClient() {
  const [activeTab, setActiveTab] = useState<AudienceType>("NOIVOS");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setFaqOpen(faqOpen === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-stone-900 font-sans antialiased overflow-x-hidden selection:bg-[#8C6D45]/20 selection:text-[#8C6D45]">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR GLOBAL */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#FCFBF9]/85 backdrop-blur-md border-b border-stone-200/60 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo MarryApp */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#C5A880] to-[#8C6D45] rounded-2xl flex items-center justify-center shadow-md shadow-amber-900/10 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif italic font-bold text-xl text-stone-900 leading-none">
                MarryApp
              </span>
              <span className="text-[10px] tracking-widest text-[#8C6D45] font-extrabold uppercase">
                Ecosystem
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
            <Link href="/dashboard">
              <Button className="bg-[#8C6D45] hover:bg-[#785c39] text-white text-xs font-bold rounded-full px-5 h-10 shadow-sm hover:shadow-md transition-all gap-1.5">
                <span>Acessar Painel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO DINÂMICO SEGMENTADO (NOIVOS / ASSESSORES / FORNECEDORES) */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden">
        {/* Elementos Decorativos de Fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-[#8C6D45]/10 via-[#C5A880]/15 to-amber-100/30 blur-3xl -z-10 pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-6">
          {/* Seletor Mobile */}
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
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF4ED] border border-[#8C6D45]/20 text-[#8C6D45] text-xs font-bold uppercase tracking-wider mb-6 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  O Ecossistema Completo para o seu Grande Dia
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-stone-900 tracking-tight leading-[1.1] font-serif">
                  O site dos seus sonhos, lista com{" "}
                  <span className="italic text-[#8C6D45]">Pix instantâneo</span> e convites no WhatsApp.
                </h1>

                <p className="mt-6 text-base sm:text-lg md:text-xl text-stone-600 max-w-2xl leading-relaxed">
                  Crie o site do seu casamento em minutos com nosso construtor no-code, receba presentes em dinheiro direto na sua conta e automatize o RSVP dos seus convidados.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                  <Link href="/site-builder">
                    <Button className="bg-[#8C6D45] hover:bg-[#785c39] text-white text-base font-bold rounded-full px-8 h-14 shadow-lg hover:shadow-xl transition-all duration-300 gap-2">
                      <Sparkles className="w-5 h-5" />
                      Criar Nosso Site Grátis
                    </Button>
                  </Link>
                  <Link href="/casamento">
                    <Button
                      variant="outline"
                      className="border-stone-300 text-stone-800 hover:bg-stone-50 text-base font-bold rounded-full px-8 h-14 shadow-xs"
                    >
                      Ver Demonstração ao Vivo
                    </Button>
                  </Link>
                </div>

                {/* Métricas Noivos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-14 pt-10 border-t border-stone-200/80 w-full text-left">
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">0% de Taxa</p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">no Pix Direto dos Noivos</p>
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
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider mb-6 shadow-xs">
                  <Building2 className="w-3.5 h-3.5" />
                  Plataforma B2B para Cerimonialistas e Assessorias
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-stone-900 tracking-tight leading-[1.1] font-serif">
                  Gerencie todos os seus casamentos{" "}
                  <span className="italic text-[#8C6D45]">sem planilhas perdidas</span>.
                </h1>

                <p className="mt-6 text-base sm:text-lg md:text-xl text-stone-600 max-w-2xl leading-relaxed">
                  Controle múltiplos eventos simultâneos, checklist inteligente de 365 dias, mapa de mesas interativo e relatórios de buffet com exportação em 1 clique.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                  <Link href="/convidados">
                    <Button className="bg-[#8C6D45] hover:bg-[#785c39] text-white text-base font-bold rounded-full px-8 h-14 shadow-lg hover:shadow-xl transition-all duration-300 gap-2">
                      <UserCheck className="w-5 h-5" />
                      Cadastrar Assessoria Parceira
                    </Button>
                  </Link>
                  <Link href="/mesas">
                    <Button
                      variant="outline"
                      className="border-stone-300 text-stone-800 hover:bg-stone-50 text-base font-bold rounded-full px-8 h-14 shadow-xs"
                    >
                      Conhecer Painel Multi-Eventos
                    </Button>
                  </Link>
                </div>

                {/* Métricas Assessores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-14 pt-10 border-t border-stone-200/80 w-full text-left">
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
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-6 shadow-xs">
                  <Compass className="w-3.5 h-3.5" />
                  Marketplace Qualificado de Fornecedores
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-stone-900 tracking-tight leading-[1.1] font-serif">
                  Conecte-se com casais reais prontos para contratar{" "}
                  <span className="italic text-[#8C6D45]">na sua região</span>.
                </h1>

                <p className="mt-6 text-base sm:text-lg md:text-xl text-stone-600 max-w-2xl leading-relaxed">
                  Defina seu raio de atendimento e entrega, agende reuniões online ou presenciais e feche novos contratos com noivos de alto poder aquisitivo.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                  <Link href="/fornecedores">
                    <Button className="bg-emerald-700 hover:bg-emerald-800 text-white text-base font-bold rounded-full px-8 h-14 shadow-lg hover:shadow-xl transition-all duration-300 gap-2">
                      <Compass className="w-5 h-5" />
                      Anunciar Minha Empresa
                    </Button>
                  </Link>
                  <Link href="/fornecedores">
                    <Button
                      variant="outline"
                      className="border-stone-300 text-stone-800 hover:bg-stone-50 text-base font-bold rounded-full px-8 h-14 shadow-xs"
                    >
                      Explorar Marketplace Parceiro
                    </Button>
                  </Link>
                </div>

                {/* Métricas Fornecedores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-14 pt-10 border-t border-stone-200/80 w-full text-left">
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
      {/* 3. SHOWCASE DOS PILARES (CARDS DE RECURSOS EM DESTAQUE) */}
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
            {/* Card 1: Construtor No-Code */}
            <div className="p-8 rounded-3xl bg-[#FAF8F5] border border-stone-200/80 hover:border-[#8C6D45]/40 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#8C6D45]/10 text-[#8C6D45] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Sliders className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 font-serif mb-2">
                  Construtor de Site No-Code
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Personalize sua história, dress code com paleta de cores, mapa com botões de Waze/Uber, dicas de hotéis e playlist do Spotify em blocos modulares.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-200/60 flex items-center text-xs font-bold text-[#8C6D45] gap-1 group-hover:gap-2 transition-all">
                <span>Personalizar Site</span>
                <ArrowRight className="w-4 h-4" />
              </div>
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
              <div className="mt-6 pt-4 border-t border-stone-200/60 flex items-center text-xs font-bold text-emerald-700 gap-1 group-hover:gap-2 transition-all">
                <span>Ver Automações</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 3: Fornecedores por Região */}
            <div className="p-8 rounded-3xl bg-[#FAF8F5] border border-stone-200/80 hover:border-[#8C6D45]/40 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 font-serif mb-2">
                  Marketplace com Raio de Entrega
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Encontre e contrate fornecedores verificados que atendem exatamente a sua cidade e agende reuniões online ou presenciais com agenda integrada.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-200/60 flex items-center text-xs font-bold text-blue-700 gap-1 group-hover:gap-2 transition-all">
                <span>Explorar Fornecedores</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. TABELA DE PLANOS & PREÇOS TRANSPARENTES */}
      {/* ========================================================================= */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge className="bg-[#8C6D45]/10 text-[#8C6D45] border-[#8C6D45]/20 font-bold uppercase tracking-wider mb-2">
            Planos Transparentes
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-serif">
            Escolha o plano ideal para a sua celebração
          </h2>
          <p className="text-sm text-stone-500 mt-2">
            Sem pegadinhas. Receba seus presentes com saque no mesmo dia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Plano Básico */}
          <div className="p-8 rounded-3xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Para Começar
              </span>
              <h3 className="text-2xl font-bold text-stone-900 font-serif mt-1">Plano Básico</h3>
              <p className="text-xs text-stone-500 mt-1">Ideal para noivos que querem um site rápido e funcional.</p>

              <div className="my-6">
                <span className="text-4xl font-extrabold text-stone-900">Grátis</span>
                <span className="text-xs text-stone-400 font-medium"> / para sempre</span>
              </div>

              <ul className="space-y-3 text-xs text-stone-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Site dos Noivos com subdomínio</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Lista de Presentes com Pix</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>RSVP padrão no site</span>
                </li>
                <li className="flex items-center gap-2 text-stone-300">
                  <span>✕ Automações de WhatsApp</span>
                </li>
              </ul>
            </div>

            <Link href="/site-builder" className="mt-8">
              <Button variant="outline" className="w-full rounded-full font-bold h-12 border-stone-300">
                Começar Grátis
              </Button>
            </Link>
          </div>

          {/* Plano Classic PRO (Destaque) */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#FAF4ED] to-white border-2 border-[#8C6D45] shadow-xl flex flex-col justify-between relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#8C6D45] text-white text-[10px] font-extrabold uppercase tracking-wider px-4 py-1 rounded-full shadow-xs">
              Mais Escolhido pelos Casais
            </div>

            <div>
              <span className="text-xs font-bold text-[#8C6D45] uppercase tracking-wider">
                Experiência Completa
              </span>
              <h3 className="text-2xl font-bold text-stone-900 font-serif mt-1">Plano Classic</h3>
              <p className="text-xs text-stone-500 mt-1">Tudo o que você precisa com automações no WhatsApp.</p>

              <div className="my-6">
                <span className="text-sm text-stone-400 font-bold">R$ </span>
                <span className="text-4xl font-extrabold text-stone-900">149</span>
                <span className="text-xs text-stone-400 font-medium"> / taxa única</span>
              </div>

              <ul className="space-y-3 text-xs text-stone-700 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8C6D45]" />
                  <span>Construtor No-Code com todos os blocos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8C6D45]" />
                  <span>Disparos automáticos no WhatsApp</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8C6D45]" />
                  <span>Mural de Recados & Dicas de Trajes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8C6D45]" />
                  <span>Credenciamento com QR Code na portaria</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8C6D45]" />
                  <span>Saque Pix no mesmo dia</span>
                </li>
              </ul>
            </div>

            <Link href="/site-builder" className="mt-8">
              <Button className="w-full bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold h-12 shadow-md">
                Criar Meu Casamento Classic
              </Button>
            </Link>
          </div>

          {/* Plano Fornecedores PRO */}
          <div className="p-8 rounded-3xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Para Fornecedores
              </span>
              <h3 className="text-2xl font-bold text-stone-900 font-serif mt-1">Fornecedor Pro</h3>
              <p className="text-xs text-stone-500 mt-1">Para empresas de eventos que desejam fechar contratos.</p>

              <div className="my-6">
                <span className="text-sm text-stone-400 font-bold">R$ </span>
                <span className="text-4xl font-extrabold text-stone-900">99</span>
                <span className="text-xs text-stone-400 font-medium"> / mês</span>
              </div>

              <ul className="space-y-3 text-xs text-stone-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Selo de Fornecedor Verificado</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Leads e solicitações ilimitadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Filtro geolocalizado de atendimento</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Agendamento de reuniões online</span>
                </li>
              </ul>
            </div>

            <Link href="/fornecedores" className="mt-8">
              <Button variant="outline" className="w-full rounded-full font-bold h-12 border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                Cadastrar Minha Empresa
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FAQ INTERATIVO */}
      {/* ========================================================================= */}
      <section className="py-20 bg-stone-100/60 border-t border-stone-200">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif">
              Perguntas Frequentes
            </h2>
            <p className="text-xs text-stone-500 mt-1">Dúvidas sobre o funcionamento do MarryApp</p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Como os noivos recebem o dinheiro dos presentes?",
                a: "No MarryApp, o convidado pode pagar via Pix ou Cartão de Crédito em até 12x. Os valores ficam disponíveis na Carteira e você pode solicitar o resgate direto via Pix para a sua conta bancária a qualquer momento.",
              },
              {
                q: "Como funcionam as mensagens automáticas de WhatsApp?",
                a: "O sistema conecta-se com a Evolution API e dispara convites, lembretes de RSVP com botões interativos e mensagens de agradecimento com nome personalizado para cada convidado.",
              },
              {
                q: "Como um fornecedor define suas regiões de entrega e atendimento?",
                a: "No portal do fornecedor, você pode selecionar suas cidades e regiões de atuação (ex: Capital, Litoral, Interior ou Brasil todo) e configurar se atende presencialmente, online ou ambos.",
              },
              {
                q: "Como os assessores de casamento podem utilizar a plataforma?",
                a: "Assessores possuem um painel multieventos onde podem gerenciar todos os casamentos do ano, com checklist cronológico de 365 dias, mapa de mesas interativo e relatórios de buffet.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-stone-800 hover:text-[#8C6D45] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                      faqOpen === idx ? "rotate-180 text-[#8C6D45]" : ""
                    }`}
                  />
                </button>
                {faqOpen === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-stone-600 leading-relaxed border-t border-stone-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FOOTER INSTITUCIONAL */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-stone-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#8C6D45] rounded-xl flex items-center justify-center text-white">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <span className="font-serif italic font-bold text-lg text-stone-900">MarryApp</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500 font-medium">
            <Link href="/casamento" className="hover:text-stone-900 transition-colors">
              Demonstração do Casal
            </Link>
            <Link href="/fornecedores" className="hover:text-stone-900 transition-colors">
              Marketplace de Fornecedores
            </Link>
            <Link href="/site-builder" className="hover:text-stone-900 transition-colors">
              Construtor de Site
            </Link>
            <Link href="/login" className="hover:text-stone-900 transition-colors">
              Área Administrativa
            </Link>
          </div>

          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} MarryApp — O Ecossistema de Casamentos.
          </p>
        </div>
      </footer>
    </div>
  );
}
