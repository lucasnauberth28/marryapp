import localFont from "next/font/local";

// Urbanist (OFL), variável no peso, só o subconjunto latino. Arquivo local: o build não depende de rede.
// Títulos da landing e das telas públicas. O logotipo continua em Bodoni.
export const urbanist = localFont({
  src: "./urbanist-latin.woff2",
  variable: "--font-urbanist",
  weight: "100 900",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
