// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { RevealObserver } from "@/components/motion/reveal-observer";

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
  description: "Do convite ao grande dia, tudo num só sim. Site do casal, confirmações pelo WhatsApp, presentes em Pix e fornecedores.",
  applicationName: "Aceito",
  // iPhone: ícone da tela de início e abertura em tela cheia quando instalado
  icons: { apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Aceito", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#F7F3EC",
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
      </head>
      <body className="min-h-screen bg-linho font-sans text-tinta">
        <RevealObserver />
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              borderRadius: "16px",
              padding: "16px",
              fontSize: "14px",
              boxShadow: "0 16px 40px -12px rgba(35, 28, 36, 0.22)",
            },
          }}
        />
      </body>
    </html>
  );
}
