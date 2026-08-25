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
  ChevronDown,
  Building2,
  UserCheck,
  Sliders,
  Send,
  Star,
  Zap,
  Percent,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WeddingRingsIcon } from "@/components/icons/wedding-rings";
import { PlanCalculator } from "@/components/pricing/plan-calculator";

type AudienceType = "NOIVOS" | "ASSESSORES" | "FORNECEDORES";
type PricingAudience = "COUPLE" | "VENDOR";

export function HomeLandingClient() {
  const [activeTab, setActiveTab] = useState<AudienceType>("NOIVOS");
  const [pricingType, setPricingType] = useState<PricingAudience>("COUPLE");
  const [detailedPricingType, setDetailedPricingType] = useState<PricingAudience>("COUPLE");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setFaqOpen(faqOpen === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-stone-900 font-sans antialiased overflow-x-hidden selection:bg-[#8C6D45]/20 selection:text-[#8C6D45]">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR GLOBAL COM LOGOTIPO DE ALIANÇAS */}
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
              <span className="text-[9px] tracking-widest text-[#8C6D45] font-extrabold uppercase">
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
      {/* 2. HERO DINÂMICO LIMPO (SEM BADGE E SEM BOTÕES NO BANNER) */}
      {/* ========================================================================= */}
      <section className="relative pt-16 pb-16 md:pt-20 md:pb-20 overflow-hidden">
        {/* Fundo com Iluminação Sutil */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-gradient-to-tr from-[#8C6D45]/10 via-[#C5A880]/15 to-amber-100/30 blur-3xl -z-10 pointer-events-none rounded-full" />

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
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-stone-900 tracking-tight leading-[1.1] font-serif">
                  O site dos seus sonhos, lista com{" "}
                  <span className="italic text-[#8C6D45]">Pix instantâneo</span> e convites no WhatsApp.
                </h1>

                <p className="mt-6 text-base sm:text-lg md:text-xl text-stone-600 max-w-2xl leading-relaxed">
                  Crie o site do seu casamento em minutos com nosso construtor no-code, receba presentes em dinheiro direto na sua conta e automatize o RSVP dos seus convidados.
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
      {/* 3. PONTO 1 DE PLANOS (SELETOR RÁPIDO INTERATIVO MAIS ACIMA) */}
      {/* ========================================================================= */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex bg-stone-100 p-1.5 rounded-full border border-stone-200 shadow-xs mb-4">
            <button
              onClick={() => setPricingType("COUPLE")}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                pricingType === "COUPLE"
                  ? "bg-white text-[#8C6D45] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              💍 Planos para Casais
            </button>
            <button
              onClick={() => setPricingType("VENDOR")}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                pricingType === "VENDOR"
                  ? "bg-white text-[#8C6D45] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              🤝 Planos para Fornecedores
            </button>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-serif">
            {pricingType === "COUPLE" ? "Comece seu Casamento Hoje" : "Impulsione sua Empresa de Eventos"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-2">
            {pricingType === "COUPLE"
              ? "Escolha o plano perfeito com taxa zero no Pix e liberação imediata."
              : "Conecte-se com dezenas de noivos qualificados na sua região de atuação."}
          </p>
        </div>

        {/* 💍 SELEÇÃO DE PLANOS PARA CASAIS (CALCULADORA MODULAR & PACOTES) */}
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

            {/* 2. Fornecedor Pro (DESTAQUE) */}
            <div className="bg-gradient-to-b from-emerald-50/50 to-white p-7 rounded-3xl border-2 border-emerald-600 shadow-lg flex flex-col justify-between relative hover:shadow-xl transition-all">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-4 py-1 rounded-full shadow-xs">
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
      {/* 4. SHOWCASE DOS PILARES (CARD 1: PIX/CARTÃO SEM TAXA NO CLASSIC) */}
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
            {/* Card 1 ATUALIZADO: Pix e Cartão com Taxa Zero no Classic */}
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
                  Marketplace com Raio de Entrega
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
      {/* 5. PONTO 2 DE PLANOS (MATRIZ COMPARATIVA DETALHADA NO FINAL) */}
      {/* ========================================================================= */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge className="bg-[#8C6D45]/10 text-[#8C6D45] border-[#8C6D45]/20 font-bold uppercase tracking-wider mb-2">
            Comparativo Detalhado
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-serif">
            Tabela de Recursos Completa
          </h2>
          <p className="text-sm text-stone-500 mt-2">
            Compare cada funcionalidade e escolha com total transparência e segurança.
          </p>

          <div className="inline-flex bg-stone-100 p-1 rounded-full border border-stone-200 mt-6">
            <button
              onClick={() => setDetailedPricingType("COUPLE")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                detailedPricingType === "COUPLE" ? "bg-white text-[#8C6D45] shadow-xs" : "text-stone-600"
              }`}
            >
              💍 Noivos (Básico vs Classic vs VIP)
            </button>
            <button
              onClick={() => setDetailedPricingType("VENDOR")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                detailedPricingType === "VENDOR" ? "bg-white text-[#8C6D45] shadow-xs" : "text-stone-600"
              }`}
            >
              🤝 Fornecedores (Start vs Pro vs Master)
            </button>
          </div>
        </div>

        {/* Tabela Detalhada para Noivos */}
        {detailedPricingType === "COUPLE" && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-900 font-serif font-bold text-sm">
                    <th className="py-4 pr-4">Recurso / Funcionalidade</th>
                    <th className="py-4 px-4 text-center">Plano Básico (R$ 0)</th>
                    <th className="py-4 px-4 text-center bg-[#FAF4ED] text-[#8C6D45] rounded-t-2xl">Plano Classic (R$ 149)</th>
                    <th className="py-4 px-4 text-center">Plano VIP (R$ 299)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                  <tr>
                    <td className="py-3.5 pr-4 font-bold text-stone-900">Taxa de Resgate no Pix dos Noivos</td>
                    <td className="py-3.5 px-4 text-center text-amber-700">2,99% por presente</td>
                    <td className="py-3.5 px-4 text-center bg-[#FAF4ED]/60 font-bold text-emerald-700">0% (Taxa Zero)</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-700">0% (Taxa Zero)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4">Construtor de Site No-Code Completo</td>
                    <td className="py-3.5 px-4 text-center text-stone-400">Básico</td>
                    <td className="py-3.5 px-4 text-center bg-[#FAF4ED]/60 text-emerald-600">✓ Todos os blocos</td>
                    <td className="py-3.5 px-4 text-center text-emerald-600">✓ Todos os blocos</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4">Disparos de Convites Automáticos no WhatsApp</td>
                    <td className="py-3.5 px-4 text-center text-stone-300">✕</td>
                    <td className="py-3.5 px-4 text-center bg-[#FAF4ED]/60 text-emerald-600">✓ Ilimitado</td>
                    <td className="py-3.5 px-4 text-center text-emerald-600">✓ Ilimitado</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4">Lembretes de RSVP com Botões Interativos</td>
                    <td className="py-3.5 px-4 text-center text-stone-300">✕</td>
                    <td className="py-3.5 px-4 text-center bg-[#FAF4ED]/60 text-emerald-600">✓ Automático</td>
                    <td className="py-3.5 px-4 text-center text-emerald-600">✓ Automático</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4">Credenciamento com QR Code na Entrada</td>
                    <td className="py-3.5 px-4 text-center text-stone-300">✕</td>
                    <td className="py-3.5 px-4 text-center bg-[#FAF4ED]/60 text-emerald-600">✓ Incluso</td>
                    <td className="py-3.5 px-4 text-center text-emerald-600">✓ Incluso</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4">Domínio Próprio (.com.br) Incluso</td>
                    <td className="py-3.5 px-4 text-center text-stone-300">✕</td>
                    <td className="py-3.5 px-4 text-center bg-[#FAF4ED]/60 text-stone-300">✕</td>
                    <td className="py-3.5 px-4 text-center text-amber-700 font-bold">✓ 1 ano grátis</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4">Mural de Fotos ao Vivo nas Mesas (Telão)</td>
                    <td className="py-3.5 px-4 text-center text-stone-300">✕</td>
                    <td className="py-3.5 px-4 text-center bg-[#FAF4ED]/60 text-stone-300">✕</td>
                    <td className="py-3.5 px-4 text-center text-amber-700 font-bold">✓ Incluso</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td className="py-4 pr-4"></td>
                    <td className="py-4 px-4 text-center">
                      <Link href="/assinar?tipo=casal&plano=basic">
                        <Button variant="outline" className="rounded-full h-10 px-4 text-xs font-bold">Assinar Básico</Button>
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-center bg-[#FAF4ED] rounded-b-2xl">
                      <Link href="/assinar?tipo=casal&plano=classic">
                        <Button className="bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full h-10 px-5 text-xs font-bold">Assinar Classic</Button>
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Link href="/assinar?tipo=casal&plano=vip">
                        <Button variant="outline" className="rounded-full h-10 px-4 text-xs font-bold border-amber-600 text-amber-700">Assinar VIP</Button>
                      </Link>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Tabela Detalhada para Fornecedores */}
        {detailedPricingType === "VENDOR" && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-900 font-serif font-bold text-sm">
                    <th className="py-4 pr-4">Recurso para Empresas</th>
                    <th className="py-4 px-4 text-center">Fornecedor Start (R$ 0)</th>
                    <th className="py-4 px-4 text-center bg-emerald-50 text-emerald-800 rounded-t-2xl">Fornecedor Pro (R$ 99/mês)</th>
                    <th className="py-4 px-4 text-center">Fornecedor Master (R$ 249/mês)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                  <tr>
                    <td className="py-3.5 pr-4 font-bold text-stone-900">Selo de Fornecedor Verificado</td>
                    <td className="py-3.5 px-4 text-center text-stone-300">✕</td>
                    <td className="py-3.5 px-4 text-center bg-emerald-50/50 font-bold text-emerald-700">✓ Selo Pro</td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-700">✓ Selo Master</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4">Limite de Orçamentos e Leads por Mês</td>
                    <td className="py-3.5 px-4 text-center text-stone-500">Até 3 por mês</td>
                    <td className="py-3.5 px-4 text-center bg-emerald-50/50 font-bold text-emerald-700">Ilimitado</td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-700">Ilimitado</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4">Regiões de Atendimento Cadastradas</td>
                    <td className="py-3.5 px-4 text-center text-stone-500">1 região</td>
                    <td className="py-3.5 px-4 text-center bg-emerald-50/50 text-emerald-700 font-bold">Múltiplas regiões</td>
                    <td className="py-3.5 px-4 text-center text-blue-700 font-bold">Brasil Todo</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4">Agendamento de Reuniões Online/Presenciais</td>
                    <td className="py-3.5 px-4 text-center text-stone-300">✕</td>
                    <td className="py-3.5 px-4 text-center bg-emerald-50/50 text-emerald-700">✓ Integrado</td>
                    <td className="py-3.5 px-4 text-center text-blue-700">✓ Integrado</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4">Posição de Destaque nas Buscas</td>
                    <td className="py-3.5 px-4 text-center text-stone-300">Padrão</td>
                    <td className="py-3.5 px-4 text-center bg-emerald-50/50 text-emerald-700">Prioritário</td>
                    <td className="py-3.5 px-4 text-center text-blue-700 font-bold">Topo Absoluto</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td className="py-4 pr-4"></td>
                    <td className="py-4 px-4 text-center">
                      <Link href="/assinar?tipo=fornecedor&plano=start">
                        <Button variant="outline" className="rounded-full h-10 px-4 text-xs font-bold">Começar Start</Button>
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-center bg-emerald-50 rounded-b-2xl">
                      <Link href="/assinar?tipo=fornecedor&plano=pro">
                        <Button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-full h-10 px-5 text-xs font-bold">Assinar Pro</Button>
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Link href="/assinar?tipo=fornecedor&plano=master">
                        <Button variant="outline" className="rounded-full h-10 px-4 text-xs font-bold border-blue-600 text-blue-700">Assinar Master</Button>
                      </Link>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. FAQ INTERATIVO */}
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
                q: "Por que o Plano Classic tem 0% de taxa no Pix dos noivos?",
                a: "No Plano Classic cobramos apenas uma taxa única de ativação. Com isso, 100% do valor que seus convidados enviarem via Pix cai diretamente na sua conta, sem descontos percentuais abusivos de outras plataformas.",
              },
              {
                q: "Como os convidados pagam no cartão de crédito?",
                a: "O convidado pode parcelar em até 12x no cartão de crédito. A pequena taxa de processamento do cartão é paga pelo convidado no checkout ou repassada, garantindo que o casal receba o valor líquido desejado.",
              },
              {
                q: "Como funcionam as mensagens automáticas de WhatsApp?",
                a: "O sistema conecta-se com a Evolution API e dispara convites, lembretes de RSVP com botões interativos e mensagens de agradecimento com nome personalizado para cada convidado.",
              },
              {
                q: "Como um fornecedor define suas regiões de entrega e atendimento?",
                a: "No portal do fornecedor, você pode selecionar suas cidades e regiões de atuação (ex: Capital, Litoral, Interior ou Brasil todo) e configurar se atende presencialmente, online ou ambos.",
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
      {/* 7. FOOTER INSTITUCIONAL */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-stone-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#8C6D45]/10 border border-[#8C6D45]/30 flex items-center justify-center text-[#8C6D45]">
              <WeddingRingsIcon className="w-5 h-5" />
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
