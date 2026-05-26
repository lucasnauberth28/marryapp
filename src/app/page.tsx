import Link from "next/link";
import { Heart, Gift, Calendar, MapPin } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans antialiased text-zinc-900">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Heart Icon */}
        <div className="mb-8 animate-in fade-in zoom-in duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-50 rounded-full border border-pink-100 shadow-sm">
            <Heart className="w-10 h-10 text-pink-500 fill-pink-500" />
          </div>
        </div>

        {/* Names */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-400 font-medium">
            Convidamos você para celebrar
          </p>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-zinc-900">
            Lucas{" "}
            <span className="text-pink-500">&</span>{" "}
            Giovanna
          </h1>
          <div className="flex items-center justify-center gap-6 text-zinc-500 text-sm font-medium pt-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-zinc-400" />
              Em breve
            </span>
            <span className="w-1 h-1 bg-zinc-300 rounded-full" />
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-zinc-400" />
              Local a definir
            </span>
          </div>
        </div>

        {/* Message */}
        <div className="mt-10 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <p className="text-lg text-zinc-500 leading-relaxed">
            Sua presença é o nosso maior presente. Se desejar nos ajudar a 
            começar nossa nova jornada, confira nossa lista de presentes.
          </p>
        </div>

        {/* CTA Button */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <Link
            href="/presentes"
            className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white rounded-full px-8 h-14 text-base font-bold shadow-lg hover:bg-zinc-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <Gift className="w-5 h-5" />
            Ver Lista de Presentes
          </Link>
        </div>

        {/* Decorative Divider */}
        <div className="mt-16 flex items-center gap-4 text-zinc-300">
          <div className="w-16 h-px bg-zinc-200" />
          <Heart className="w-4 h-4 fill-pink-300 text-pink-300" />
          <div className="w-16 h-px bg-zinc-200" />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/50 bg-white py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-zinc-400">
          Lucas & Giovanna © 2026 — Feito com ❤️ para o nosso grande dia
        </div>
      </footer>
    </div>
  );
}
