"use client";

import Link from "next/link";
import { WeddingRingsIcon } from "@/components/icons/wedding-rings";
import { ShieldCheck } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white py-12 px-6 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-stone-500">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#FAF4ED] flex items-center justify-center text-[#8C6D45]">
            <WeddingRingsIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="font-serif italic font-bold text-stone-900 text-sm block">
              MarryApp
            </span>
            <span>A plataforma mais elegante para o seu grande dia.</span>
          </div>
        </div>

        <div className="flex items-center gap-6 font-bold">
          <Link href="/fornecedores" className="hover:text-stone-900 transition-colors">
            Fornecedores
          </Link>
          <Link href="/assinar" className="hover:text-stone-900 transition-colors">
            Planos & Preços
          </Link>
          <Link href="/login" className="hover:text-stone-900 transition-colors">
            Área do Casal
          </Link>
        </div>

        <div className="flex items-center gap-2 text-stone-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Ambiente Seguro & Conforme à LGPD</span>
        </div>
      </div>
    </footer>
  );
}
