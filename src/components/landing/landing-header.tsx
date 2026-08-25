"use client";

import Link from "next/link";
import { WeddingRingsIcon } from "@/components/icons/wedding-rings";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#FCFBF9]/90 backdrop-blur-md border-b border-stone-200/60">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logotipo Oficial Sutil sem borda e sem subtítulo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#FAF4ED] flex items-center justify-center text-[#8C6D45] group-hover:scale-105 transition-transform">
            <WeddingRingsIcon className="w-5 h-5" />
          </div>
          <span className="font-serif italic font-bold text-xl text-stone-900 leading-none">
            MarryApp
          </span>
        </Link>

        {/* Links & CTA */}
        <div className="flex items-center gap-3">
          <Link href="/fornecedores" className="hidden sm:inline-block text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors">
            Fornecedores
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="text-xs font-bold text-stone-700 hover:bg-stone-100 rounded-full px-4 h-9">
              Entrar
            </Button>
          </Link>
          <Link href="/assinar?tipo=casal&plano=classic">
            <Button className="bg-[#8C6D45] hover:bg-[#785c39] text-white rounded-full font-bold text-xs px-4 h-9 shadow-xs">
              Criar Meu Casamento
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
