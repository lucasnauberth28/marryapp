// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { LucideProvider } from "lucide-react";
import "./globals.css";
import { RevealObserver } from "@/components/motion/reveal-observer";
import { NavigationProgress } from "@/components/feedback/navigation-progress";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemedToaster } from "@/components/theme/themed-toaster";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

// Fontes do Manual de Marca (p.12), todas locais: o build não depende de rede. Geist e Urbanist são variáveis
// no peso (100 a 900), só o subconjunto latino. Interface em Geist 400/500/600; títulos em Urbanist 500/600.
const geist = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

// Títulos e nomes. Urbanist não tem algarismos tabulares: números e dinheiro usam a classe font-num (Geist).
const urbanist = localFont({
  src: "./fonts/urbanist-latin.woff2",
  variable: "--font-display",
  weight: "100 900",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

// Só para códigos (cupom, chave Pix, ids). Fora do manual, de uso técnico.
const plexMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-400-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-mono-500-latin.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://meuaceito.com.br"),
  title: { default: "Aceito", template: "%s · Aceito" },
  description: "Criem o site do casamento, acompanhem confirmações de presença e recebam presentes em dinheiro com o Aceito. Conheçam os planos e as taxas.",
  applicationName: "Aceito",
  openGraph: { type: "website", locale: "pt_BR", siteName: "Aceito" },
  // Declarar `icons` aqui substitui o ícone por arquivo (app/icon.svg): por isso o favicon é listado também.
  // SVG para navegadores modernos, PNG de reserva (Safari) e o ícone da tela de início do iPhone.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "Aceito", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  // Segue o sistema no primeiro quadro; o ThemeProvider acerta a cor quando a pessoa escolhe outro tema.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FCFBFA" },
    { media: "(prefers-color-scheme: dark)", color: "#141113" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geist.variable} ${urbanist.variable} ${plexMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Antes da pintura: habilita as animações de entrada só quando há JavaScript. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        {/* Antes da pintura: aplica data-theme (cookie, ou o sistema em "Do aparelho"). Sem flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-linho font-sans text-tinta">
        {/* Ícones: traço de 1,6 px com pontas arredondadas (manual p.14); quem precisa de outro traço passa strokeWidth. */}
        <LucideProvider strokeWidth={1.6}>
        <ThemeProvider>
          <RevealObserver />
          <NavigationProgress />
          {children}
          <ThemedToaster />
        </ThemeProvider>
        </LucideProvider>
      </body>
    </html>
  );
}
