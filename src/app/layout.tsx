// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { RevealObserver } from "@/components/motion/reveal-observer";
import { NavigationProgress } from "@/components/feedback/navigation-progress";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemedToaster } from "@/components/theme/themed-toaster";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Display: só a partir de 24px. Variável com eixo óptico (opsz) para nomes e títulos.
const bodoniModa = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Aceito", template: "%s · Aceito" },
  description: "Criem o site do casamento, acompanhem confirmações de presença e recebam presentes em dinheiro com o Aceito. Conheçam os planos e as taxas.",
  applicationName: "Aceito",
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
    { media: "(prefers-color-scheme: light)", color: "#F7F3EC" },
    { media: "(prefers-color-scheme: dark)", color: "#18131A" },
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
      className={`${instrumentSans.variable} ${bodoniModa.variable} ${plexMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Antes da pintura: habilita as animações de entrada só quando há JavaScript. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        {/* Antes da pintura: aplica data-theme (cookie, ou o sistema em "Do aparelho"). Sem flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-linho font-sans text-tinta">
        <ThemeProvider>
          <RevealObserver />
          <NavigationProgress />
          {children}
          <ThemedToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
