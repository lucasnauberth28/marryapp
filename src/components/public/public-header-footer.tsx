"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";

export function PublicHeaderFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCheckout = pathname.startsWith("/checkout");
  const isGiftsPage = pathname.startsWith("/presentes");

  if (isCheckout) {
    return <div className="min-h-screen bg-zinc-50 flex flex-col font-sans antialiased text-zinc-900">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans antialiased text-zinc-900">
      {/* Header Compacto e Não-Fixado para Presentes / Convidados */}
      <header
        className={`w-full bg-white/95 border-b border-zinc-200/60 text-zinc-900 ${
          isGiftsPage ? "static h-12" : "sticky top-0 z-40 backdrop-blur-md h-14"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-gradient-to-tr from-amber-700 to-amber-500 rounded-lg flex items-center justify-center shadow-sm">
              <Heart className="w-3.5 h-3.5 fill-white text-white" />
            </div>
            <span className="font-serif italic font-bold text-base text-zinc-900 tracking-tight group-hover:text-amber-800 transition-colors">
              Lucas & Giovanna
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-serif italic text-amber-900 bg-amber-50/80 border border-amber-200/80 px-3 py-1 rounded-full shadow-2xs">
            <span className="font-semibold text-zinc-700">Data do Casamento:</span>
            <span className="font-bold text-amber-900">14 de Novembro de 2026</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Footer minimalista */}
      <footer className="border-t border-zinc-200/50 bg-white py-4">
        <div className="max-w-6xl mx-auto px-6 text-center text-[11px] text-zinc-400 font-sans">
          Lucas & Giovanna © 2026 — Feito com ❤️ para o nosso grande dia
        </div>
      </footer>
    </div>
  );
}
