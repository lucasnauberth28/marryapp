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
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-xs">
              <Heart className="w-3.5 h-3.5 fill-primary-foreground text-primary-foreground" />
            </div>
            <span className="font-serif italic font-bold text-base text-zinc-900 tracking-tight group-hover:text-primary transition-colors">
              Lucas & Giovanna
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-serif italic text-primary bg-primary/10 border border-primary/25 px-3 py-1 rounded-full shadow-2xs">
            <span className="font-semibold text-zinc-700">Data do Casamento:</span>
            <span className="font-bold text-primary">11 de Outubro de 2027</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Footer minimalista */}
      <footer className="border-t border-zinc-200/50 bg-white py-4">
        <div className="max-w-6xl mx-auto px-6 text-center text-[11px] text-zinc-400 font-sans">
          Lucas & Giovanna © 2027 — Feito com ❤️ para o nosso grande dia
        </div>
      </footer>
    </div>
  );
}
