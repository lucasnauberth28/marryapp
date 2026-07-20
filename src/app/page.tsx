import Link from "next/link";
import { Heart, Gift, Calendar, MapPin } from "lucide-react";
import { getSettings } from "@/actions/settings-actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function Home() {
  const settings = await getSettings();

  const formattedWeddingDate = settings.weddingDate
    ? format(new Date(settings.weddingDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "Em breve";

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans antialiased text-zinc-900" style={{ '--theme-color': settings.themeColor } as React.CSSProperties}>
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative overflow-hidden">
        
        {settings.heroImageUrl && (
          <div 
            className="absolute inset-0 z-0 opacity-20"
            style={{ 
              backgroundImage: `url(${settings.heroImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(2px)'
            }}
          />
        )}

        <div className="relative z-10 flex flex-col items-center">
          {/* Heart Icon */}
          <div className="mb-8 animate-in fade-in zoom-in duration-700">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full shadow-sm" style={{ backgroundColor: `${settings.themeColor}15`, borderColor: `${settings.themeColor}30`, borderWidth: '1px' }}>
              <Heart className="w-10 h-10" style={{ color: settings.themeColor, fill: settings.themeColor }} />
            </div>
          </div>

          {/* Names */}
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400 font-medium">
              Convidamos você para celebrar
            </p>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-zinc-900 drop-shadow-sm">
              Lucas{" "}
              <span style={{ color: settings.themeColor }}>&</span>{" "}
              Giovanna
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-zinc-500 text-sm font-medium pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-zinc-400" />
                {formattedWeddingDate}
              </span>
              <span className="w-1 h-1 bg-zinc-300 rounded-full hidden sm:inline" />
              {settings.weddingLocationUrl ? (
                <a 
                  href={settings.weddingLocationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:underline"
                  style={{ color: settings.themeColor }}
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  {settings.weddingLocation || "Ver Local no Mapa"}
                </a>
              ) : (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  {settings.weddingLocation || "Local a definir"}
                </span>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="mt-10 max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 bg-white/60 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/40">
            <p className="text-lg text-zinc-700 leading-relaxed font-medium">
              {settings.welcomeText || 
               "Sua presença é o nosso maior presente. Se desejar nos ajudar a começar nossa nova jornada, confira nossa lista de presentes."}
            </p>
          </div>

          {/* CTA Button */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <Link
              href="/presentes"
              className="inline-flex items-center justify-center gap-2 text-white rounded-full px-8 h-14 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              style={{ backgroundColor: settings.themeColor }}
            >
              <Gift className="w-5 h-5" />
              Ver Lista de Presentes
            </Link>
          </div>

          {/* Decorative Divider */}
          <div className="mt-16 flex items-center gap-4 text-zinc-300">
            <div className="w-16 h-px bg-zinc-300" />
            <Heart className="w-4 h-4" style={{ fill: `${settings.themeColor}50`, color: `${settings.themeColor}50` }} />
            <div className="w-16 h-px bg-zinc-300" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/50 bg-white py-6 relative z-10">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-zinc-400">
          Lucas & Giovanna © 2026 — Feito com ❤️ para o nosso grande dia
        </div>
      </footer>
    </div>
  );
}
