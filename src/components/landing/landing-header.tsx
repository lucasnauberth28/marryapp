"use client";

import Link from "next/link";
import { WeddingRingsIcon } from "@/components/icons/wedding-rings";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#FCFBF9]/90 backdrop-blur-md border-b border-stone-200/60">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logotipo Oficial */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FAF4ED] to-[#FAF8F5] border border-[#8C6D45]/30 flex items-center justify-center text-[#8C6D45] shadow-xs group-hover:scale-105 transition-transform">
            <WeddingRingsIcon className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif italic font-bold text-2xl text-stone-900 leading-none">
              MarryApp
            </span>
            <span className="text-[9px] tracking-widest text-[#8C6D45] font-extrabold uppercase">
              Tecnologia para Casamentos
            </span>
          </div>
        </Link>

        {/* Links & CTA */}
        <div className="flex items-center gap-4">
          <Link href="/casamento" className="hidden sm:inline-block text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors">
            Ver Site Modelo
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="text-xs font-bold text-stone-700 hover:bg-stone-100 rounded-full px-5">
              Entrar
            </Button>
          </Link>
          <Link href="/assinar?tipo=casal&plano=classic">
            <Button className="bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold text-xs px-5 shadow-xs">
              Criar Meu Casamento
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
