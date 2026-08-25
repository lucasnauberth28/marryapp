"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  COUPLE_MODULES,
  calculateCustomPlanPrice,
} from "@/lib/pricing-modules";
import {
  Sliders,
  Percent,
  MessageCircle,
  QrCode,
  Sparkles,
  Users,
  Compass,
  Check,
  Plus,
  ArrowRight,
  ShieldCheck,
  Gift,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ICON_MAP: Record<string, any> = {
  Sliders,
  Percent,
  MessageCircle,
  QrCode,
  Sparkles,
  Users,
  Compass,
};

export function PlanCalculator() {
  const [calculatorMode, setCalculatorMode] = useState<"PACKS" | "CUSTOM">("PACKS");
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([
    "site",
    "pixZero",
    "whatsapp",
  ]);

  const toggleModule = (id: string) => {
    if (id === "site") return; // O site base sempre fica ativo
    setSelectedModuleIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const calculation = useMemo(() => {
    return calculateCustomPlanPrice(selectedModuleIds);
  }, [selectedModuleIds]);

  const customCheckoutUrl = useMemo(() => {
    const modulesParam = selectedModuleIds.join(",");
    return `/assinar?tipo=casal&custom=true&modules=${modulesParam}&amount=${calculation.total}`;
  }, [selectedModuleIds, calculation.total]);

  return (
    <div className="space-y-10 font-sans">
      {/* Alternador de Modo: Pacotes Prontos vs Monte seu Plano */}
      <div className="flex justify-center">
        <div className="inline-flex bg-stone-100/90 p-1.5 rounded-full border border-stone-200 shadow-xs">
          <button
            onClick={() => setCalculatorMode("PACKS")}
            className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              calculatorMode === "PACKS"
                ? "bg-white text-[#8C6D45] shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            📦 Pacotes Prontos Recomendados
          </button>
          <button
            onClick={() => setCalculatorMode("CUSTOM")}
            className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              calculatorMode === "CUSTOM"
                ? "bg-white text-[#8C6D45] shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>🎛️ Monte seu Plano Adaptado</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODO: MONTE SEU PLANO ADAPTADO (CALCULADORA DE MÓDULOS) */}
      {/* ========================================================================= */}
      {calculatorMode === "CUSTOM" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna de Módulos Selecionáveis */}
          <div className="lg:col-span-8 space-y-3">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D45]">
                Personalize Seus Recursos
              </span>
              <h3 className="text-2xl font-bold font-serif text-stone-900 mt-1">
                Selecione apenas o que seu casamento vai usar
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Ative ou desative qualquer funcionalidade. Você só paga taxa única pelo que escolher.
              </p>
            </div>

            <div className="space-y-3">
              {COUPLE_MODULES.map((mod) => {
                const Icon = ICON_MAP[mod.iconName] || Sliders;
                const isSelected = selectedModuleIds.includes(mod.id);
                const isBase = mod.isIncludedInBase;

                return (
                  <div
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-white border-[#8C6D45] shadow-md ring-1 ring-[#8C6D45]/30"
                        : "bg-[#FAF8F5] border-stone-200/80 hover:bg-white hover:border-stone-300 opacity-80"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-[#8C6D45] text-white"
                            : "bg-stone-200/70 text-stone-600"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-serif font-bold text-base text-stone-900">
                            {mod.name}
                          </h4>
                          {mod.highlightBadge && (
                            <Badge className="bg-[#FAF4ED] text-[#8C6D45] border-[#8C6D45]/20 text-[10px] font-bold">
                              {mod.highlightBadge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 mt-1 leading-relaxed max-w-xl">
                          {mod.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      <span className="font-extrabold text-sm text-stone-900">
                        {isBase
                          ? "Grátis"
                          : new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(mod.price / 100)}
                      </span>

                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-[#8C6D45] text-white"
                            : "border-2 border-stone-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna Fixa: Resumo do Pedido em Tempo Real */}
          <div className="lg:col-span-4 sticky top-28 bg-gradient-to-b from-[#FAF4ED] to-white p-7 rounded-3xl border-2 border-[#8C6D45]/40 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <Badge className="bg-[#8C6D45] text-white font-extrabold text-[10px] uppercase tracking-wider">
                Plano Personalizado
              </Badge>
              <span className="text-xs text-stone-400 font-bold">
                {selectedModuleIds.length} módulos ativos
              </span>
            </div>

            <div>
              <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
                Investimento Total do Casamento:
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black text-stone-900 font-serif">
                  {calculation.total === 0
                    ? "Grátis"
                    : new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(calculation.total / 100)}
                </span>
                <span className="text-xs text-stone-500 font-medium">/ taxa única</span>
              </div>

              {calculation.discountAmount > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{calculation.discountBadge}</span>
                </div>
              )}
            </div>

            {/* Lista dos Recursos Selecionados */}
            <div className="pt-4 border-t border-stone-200/80 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Itens incluídos no seu pacote:
              </span>
              <ul className="space-y-1.5 text-xs text-stone-700 font-medium">
                {calculation.selectedModules.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 truncate">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{m.name}</span>
                    </span>
                    <span className="text-[11px] font-bold text-stone-400 shrink-0">
                      {m.price === 0 ? "Grátis" : `R$ ${m.price / 100}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botão de Checkout Customizado */}
            <Link href={customCheckoutUrl} className="block mt-6">
              <Button className="w-full bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold h-14 text-sm shadow-md gap-2">
                <span>Contratar Meu Plano Adaptado</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <div className="flex items-center gap-2.5 text-[11px] text-stone-500 pt-2 border-t border-stone-100">
              <ShieldCheck className="w-4 h-4 text-[#8C6D45] shrink-0" />
              <span>Sem mensalidades ocultas. Pagamento único com saque Pix liberado.</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODO: PACOTES PRONTOS RECOMENDADOS (BÁSICO, CLASSIC, VIP) */}
      {/* ========================================================================= */}
      {calculatorMode === "PACKS" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* 1. Casal Básico */}
          <div className="bg-white p-7 rounded-3xl border border-stone-200 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-all">
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Para Começar</span>
              <h3 className="text-xl font-bold font-serif text-stone-900 mt-1">Plano Básico</h3>
              <p className="text-xs text-stone-500 mt-1">Site básico e lista de presentes.</p>

              <div className="my-6">
                <span className="text-3xl font-extrabold text-stone-900">Grátis</span>
                <span className="text-xs text-stone-400 font-medium"> / taxa 2,99% por presente</span>
              </div>

              <ul className="space-y-2.5 text-xs text-stone-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Site padrão com subdomínio</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Lista de presentes com Pix e Cartão</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>RSVP padrão no site</span>
                </li>
                <li className="flex items-center gap-2 text-stone-300">
                  <span>✕ Taxa 0% no Pix dos noivos</span>
                </li>
                <li className="flex items-center gap-2 text-stone-300">
                  <span>✕ Automações de WhatsApp</span>
                </li>
              </ul>
            </div>

            <Link href="/assinar?tipo=casal&plano=basic" className="mt-8">
              <Button variant="outline" className="w-full rounded-full font-bold h-12 text-xs border-stone-300">
                Começar Grátis
              </Button>
            </Link>
          </div>

          {/* 2. Casal Classic (DESTAQUE) */}
          <div className="bg-gradient-to-b from-[#FAF4ED] to-white p-7 rounded-3xl border-2 border-[#8C6D45] shadow-lg flex flex-col justify-between relative hover:shadow-xl transition-all">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8C6D45] text-white text-[10px] font-extrabold uppercase tracking-wider px-4 py-1 rounded-full shadow-xs">
              Mais Escolhido pelos Casais
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-[#8C6D45] tracking-wider">Experiência Completa</span>
              <h3 className="text-xl font-bold font-serif text-stone-900 mt-1">Plano Classic</h3>
              <p className="text-xs text-stone-500 mt-1">Construtor completo e WhatsApp.</p>

              <div className="my-6">
                <span className="text-xs text-stone-400 font-bold">R$ </span>
                <span className="text-3xl font-extrabold text-stone-900">149</span>
                <span className="text-xs text-stone-400 font-medium"> / taxa única</span>
                <Badge className="ml-2 bg-emerald-100 text-emerald-800 text-[10px] font-bold">0% Taxa Pix</Badge>
              </div>

              <ul className="space-y-2.5 text-xs text-stone-700 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8C6D45] shrink-0" />
                  <span><strong>0% de Taxa no Pix</strong> (Saque 100% integral)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8C6D45] shrink-0" />
                  <span>Construtor No-Code com todos os blocos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8C6D45] shrink-0" />
                  <span>Disparos automáticos no WhatsApp</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8C6D45] shrink-0" />
                  <span>Credenciamento com QR Code na portaria</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#8C6D45] shrink-0" />
                  <span>Mural de Recados & Dicas de Traje</span>
                </li>
              </ul>
            </div>

            <Link href="/assinar?tipo=casal&plano=classic" className="mt-8">
              <Button className="w-full bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold h-12 text-xs shadow-md">
                Escolher Plano Classic
              </Button>
            </Link>
          </div>

          {/* 3. Casal VIP Premium */}
          <div className="bg-white p-7 rounded-3xl border border-stone-200 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-all">
            <div>
              <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">Experiência VIP</span>
              <h3 className="text-xl font-bold font-serif text-stone-900 mt-1">Plano VIP</h3>
              <p className="text-xs text-stone-500 mt-1">Domínio próprio e fotos ao vivo.</p>

              <div className="my-6">
                <span className="text-xs text-stone-400 font-bold">R$ </span>
                <span className="text-3xl font-extrabold text-stone-900">299</span>
                <span className="text-xs text-stone-400 font-medium"> / taxa única</span>
              </div>

              <ul className="space-y-2.5 text-xs text-stone-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Tudo incluído no Plano Classic</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Domínio Próprio (.com.br)</strong> por 1 ano</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Álbum Coletivo ao Vivo nas Mesas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Concierge VIP via WhatsApp dedicado</span>
                </li>
              </ul>
            </div>

            <Link href="/assinar?tipo=casal&plano=vip" className="mt-8">
              <Button variant="outline" className="w-full rounded-full font-bold h-12 text-xs border-amber-600 text-amber-700 hover:bg-amber-50">
                Escolher Plano VIP
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
