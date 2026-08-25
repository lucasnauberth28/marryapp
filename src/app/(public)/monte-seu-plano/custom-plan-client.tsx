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
  ArrowRight,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Heart,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";

const ICON_MAP: Record<string, any> = {
  Sliders,
  Percent,
  MessageCircle,
  QrCode,
  Sparkles,
  Users,
  Compass,
};

export function CustomPlanClient() {
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([
    "site",
    "pixZero",
    "whatsapp",
  ]);

  const toggleModule = (id: string) => {
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

  const selectedCount = selectedModuleIds.length;
  const totalCount = COUPLE_MODULES.length;
  const progressPercent = Math.round((selectedCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-stone-900 font-sans flex flex-col justify-between">
      <LandingHeader />

      <main className="flex-1 py-12 px-6 max-w-7xl mx-auto w-full space-y-10">
        {/* Navegação de Volta & Cabeçalho Principal */}
        <div className="space-y-4">
          <Link
            href="/#planos"
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para os pacotes fixos</span>
          </Link>

          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF4ED] border border-[#8C6D45]/30 text-[#8C6D45] text-xs font-bold uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5" />
              <span>Calculadora de Módulos Avulsos</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-serif text-stone-900">
              Monte o Plano Perfeito para o seu Casamento
            </h1>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              Ative ou desative cada funcionalidade individualmente. Você só paga taxa única pelo que for utilizar, com descontos progressivos automáticos de até 25% OFF.
            </p>
          </div>
        </div>

        {/* Grade de Módulos + Painel Lateral Fixo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna Principal: Lista de Módulos */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Catálogo de Funcionalidades ({selectedCount} de {totalCount} selecionadas)
              </span>
              <div className="flex items-center gap-2 text-xs font-bold text-[#8C6D45]">
                <span>{progressPercent}% do sistema ativo</span>
              </div>
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
                    className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-5 ${
                      isSelected
                        ? "bg-white border-[#8C6D45] shadow-lg ring-2 ring-[#8C6D45]/20 scale-[1.01]"
                        : "bg-[#FAF8F5] border-stone-200/80 hover:bg-white hover:border-stone-300 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-xs ${
                          isSelected
                            ? "bg-[#8C6D45] text-white"
                            : "bg-stone-200/80 text-stone-600"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-serif font-bold text-lg text-stone-900">
                            {mod.name}
                          </h3>
                          {mod.highlightBadge && (
                            <Badge className="bg-[#FAF4ED] text-[#8C6D45] border-[#8C6D45]/30 text-[10px] font-bold">
                              {mod.highlightBadge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed max-w-xl">
                          {mod.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      <div className="text-right">
                        <span className="font-extrabold text-base text-stone-900 block">
                          {isBase
                            ? "Grátis"
                            : new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(mod.price / 100)}
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium block">taxa única</span>
                      </div>

                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-[#8C6D45] text-white shadow-xs"
                            : "border-2 border-stone-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-5 h-5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Painel Lateral Sticky: Resumo do Investimento */}
          <div className="lg:col-span-4 sticky top-28 bg-gradient-to-b from-[#FAF4ED] to-white p-7 rounded-3xl border-2 border-[#8C6D45]/40 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <Badge className="bg-[#8C6D45] text-white font-extrabold text-[10px] uppercase tracking-wider">
                Plano Personalizado
              </Badge>
              <span className="text-xs text-stone-500 font-bold">
                {selectedCount} módulos ativos
              </span>
            </div>

            <div>
              <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
                Investimento Total do Casal:
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-stone-900 font-serif">
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
                <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold shadow-2xs">
                  <Zap className="w-4 h-4 text-emerald-700" />
                  <span>{calculation.discountBadge}</span>
                </div>
              )}
            </div>

            {/* Lista dos Recursos Selecionados */}
            <div className="pt-4 border-t border-stone-200/80 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Recursos incluídos no seu pacote:
              </span>
              <ul className="space-y-2 text-xs text-stone-700 font-medium max-h-56 overflow-y-auto pr-1">
                {calculation.selectedModules.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-4 h-4 text-[#8C6D45] shrink-0" />
                      <span className="truncate">{m.name}</span>
                    </span>
                    <span className="text-[11px] font-bold text-stone-500 shrink-0">
                      {m.price === 0 ? "Grátis" : `R$ ${m.price / 100}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botão de Contratação */}
            <Link href={customCheckoutUrl} className="block mt-6">
              <Button className="w-full bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold h-14 text-sm shadow-xl hover:scale-105 transition-all gap-2 cursor-pointer">
                <span>Contratar Plano Personalizado</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-3 border-t border-stone-200/60">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sem mensalidades ou surpresas. Pagamento único com liberação imediata.</span>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
