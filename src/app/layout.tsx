// src/app/layout.tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Lucas & Giovanna | Casamento",
  description: "Plataforma de gestão do casamento de Lucas e Giovanna",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${cormorant.variable} antialiased`}>
      <body className="min-h-screen bg-[#FAF8F5] font-sans text-stone-800">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}