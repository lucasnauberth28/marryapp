"use client";

import Link from "next/link";
import { Check, Sliders, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlanCalculator() {
  return (
    <div className="space-y-8 font-sans">
      {/* 3 PACOTES FIXOS (BÁSICO, CLASSIC, VIP) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* 1. Casal Básico */}
        <div className="bg-papel p-7 rounded-3xl border border-linha shadow-xs flex flex-col justify-between hover:border-linha transition-all">
          <div>
            <span className="text-xs font-bold uppercase text-tinta-suave tracking-wider">Para Começar</span>
            <h3 className="text-xl font-bold font-serif text-tinta mt-1">Plano Básico</h3>
            <p className="text-xs text-tinta-suave mt-1">Site padrão e lista de presentes.</p>

            <div className="my-6">
              <span className="text-3xl font-extrabold text-tinta">Grátis</span>
              <span className="text-xs text-tinta-suave font-medium"> / taxa 2,99% por presente</span>
            </div>

            <ul className="space-y-2.5 text-xs text-tinta-suave">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-sucesso shrink-0" />
                <span>Site padrão com subdomínio</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-sucesso shrink-0" />
                <span>Lista de presentes com Pix e Cartão</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-sucesso shrink-0" />
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

          <Link href="/cadastro?tipo=casal&plano=basic" className="mt-8">
            <Button variant="outline" className="w-full rounded-full font-bold h-12 text-xs border-linha">
              Começar Grátis
            </Button>
          </Link>
        </div>

        {/* 2. Casal Classic (DESTAQUE COM BADGE CENTRALIZADA) */}
        <div className="bg-gradient-to-b from-brand-50 to-white p-7 rounded-3xl border-2 border-brand shadow-lg flex flex-col justify-between relative hover:shadow-xl transition-all">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-max bg-brand text-white text-xs font-extrabold uppercase tracking-wider px-4 py-1 rounded-full shadow-xs text-center">
            Mais Escolhido pelos Casais
          </div>

          <div>
            <span className="text-xs font-bold uppercase text-brand tracking-wider">Experiência Completa</span>
            <h3 className="text-xl font-bold font-serif text-tinta mt-1">Plano Classic</h3>
            <p className="text-xs text-tinta-suave mt-1">Construtor completo e WhatsApp.</p>

            <div className="my-6">
              <span className="text-xs text-tinta-suave font-bold">R$ </span>
              <span className="text-3xl font-extrabold text-tinta">149</span>
              <span className="text-xs text-tinta-suave font-medium"> / taxa única</span>
            </div>

            <ul className="space-y-2.5 text-xs text-tinta-suave font-medium">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand shrink-0" />
                <span><strong>0% de Taxa no Pix</strong> (Saque 100% integral)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand shrink-0" />
                <span>Construtor No-Code com todos os blocos</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand shrink-0" />
                <span>Disparos automáticos no WhatsApp</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand shrink-0" />
                <span>Credenciamento com QR Code na portaria</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand shrink-0" />
                <span>Mural de Recados & Dicas de Traje</span>
              </li>
            </ul>
          </div>

          <Link href="/cadastro?tipo=casal&plano=classic" className="mt-8">
            <Button className="w-full bg-brand hover:bg-brand-600 text-white rounded-full font-bold h-12 text-xs shadow-md">
              Escolher Plano Classic
            </Button>
          </Link>
        </div>

        {/* 3. Casal VIP Premium */}
        <div className="bg-papel p-7 rounded-3xl border border-linha shadow-xs flex flex-col justify-between hover:border-linha transition-all">
          <div>
            <span className="text-xs font-bold uppercase text-aviso tracking-wider">Experiência VIP</span>
            <h3 className="text-xl font-bold font-serif text-tinta mt-1">Plano VIP</h3>
            <p className="text-xs text-tinta-suave mt-1">Domínio próprio e fotos ao vivo.</p>

            <div className="my-6">
              <span className="text-xs text-tinta-suave font-bold">R$ </span>
              <span className="text-3xl font-extrabold text-tinta">299</span>
              <span className="text-xs text-tinta-suave font-medium"> / taxa única</span>
            </div>

            <ul className="space-y-2.5 text-xs text-tinta-suave">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-aviso shrink-0" />
                <span>Tudo incluído no Plano Classic</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-aviso shrink-0" />
                <span><strong>Domínio Próprio (.com.br)</strong> por 1 ano</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-aviso shrink-0" />
                <span>Álbum Coletivo ao Vivo nas Mesas</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-aviso shrink-0" />
                <span>Concierge VIP via WhatsApp dedicado</span>
              </li>
            </ul>
          </div>

          <Link href="/cadastro?tipo=casal&plano=vip" className="mt-8">
            <Button variant="outline" className="w-full rounded-full font-bold h-12 text-xs border-amber-600 text-aviso hover:bg-aviso-suave">
              Escolher Plano VIP
            </Button>
          </Link>
        </div>
      </div>

      {/* Link de Destaque para a Página Exclusiva de Plano Personalizado */}
      <div className="text-center pt-2">
        <Link
          href="/monte-seu-plano"
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-papel border border-brand/30 text-xs font-bold text-brand hover:bg-brand-50 hover:border-brand shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <Sliders className="w-4 h-4 text-brand" />
          <span>Quero montar um plano personalizado</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
