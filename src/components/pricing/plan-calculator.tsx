"use client";

import Link from "next/link";
import { Check, Sliders, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PlanCalculator() {
  return (
    <div className="space-y-8 font-sans">
      {/* 3 PACOTES FIXOS (BÁSICO, CLASSIC, VIP) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* 1. Casal Básico */}
        <div className="bg-white p-7 rounded-3xl border border-stone-200 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-all">
          <div>
            <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Para Começar</span>
            <h3 className="text-xl font-bold font-serif text-stone-900 mt-1">Plano Básico</h3>
            <p className="text-xs text-stone-500 mt-1">Site padrão e lista de presentes.</p>

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

        {/* 2. Casal Classic (DESTAQUE COM BADGE CENTRALIZADA) */}
        <div className="bg-gradient-to-b from-[#FAF4ED] to-white p-7 rounded-3xl border-2 border-[#8C6D45] shadow-lg flex flex-col justify-between relative hover:shadow-xl transition-all">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-max bg-[#8C6D45] text-white text-[10px] font-extrabold uppercase tracking-wider px-4 py-1 rounded-full shadow-xs text-center">
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

      {/* Link de Destaque para a Página Exclusiva de Plano Personalizado */}
      <div className="text-center pt-2">
        <Link
          href="/monte-seu-plano"
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white border border-[#8C6D45]/30 text-xs font-bold text-[#8C6D45] hover:bg-[#FAF4ED] hover:border-[#8C6D45] shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <Sliders className="w-4 h-4 text-[#8C6D45]" />
          <span>Quero montar um plano personalizado</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
