// Letras dos modelos do site, hospedadas no próprio app (o build não depende de rede). Só carregam quando o modelo as usa.
import localFont from "next/font/local";

// As opções ficam escritas em cada fonte: o next/font só aceita valores literais.
export const fontePlayfair = localFont({
  src: [
    { path: "./fontes/playfair-latin.woff2", style: "normal" },
    { path: "./fontes/playfair-italic-latin.woff2", style: "italic" },
  ],
  variable: "--font-modelo-playfair",
  fallback: ["Georgia", "serif"],
  display: "swap",
  preload: false,
  weight: "100 900",
});

export const fonteCormorant = localFont({
  src: [
    { path: "./fontes/cormorant-latin.woff2", style: "normal" },
    { path: "./fontes/cormorant-italic-latin.woff2", style: "italic" },
  ],
  variable: "--font-modelo-cormorant",
  fallback: ["Georgia", "serif"],
  display: "swap",
  preload: false,
  weight: "100 900",
});

export const fonteBodoni = localFont({
  src: [
    { path: "./fontes/bodoni-latin.woff2", style: "normal" },
    { path: "./fontes/bodoni-italic-latin.woff2", style: "italic" },
  ],
  variable: "--font-modelo-bodoni",
  fallback: ["Didot", "Georgia", "serif"],
  display: "swap",
  preload: false,
  weight: "100 900",
});

export const fonteItaliana = localFont({
  src: "./fontes/italiana-latin.woff2",
  variable: "--font-modelo-italiana",
  fallback: ["Georgia", "serif"],
  display: "swap",
  preload: false,
  weight: "400",
});

export const fonteGreatVibes = localFont({
  src: "./fontes/great-vibes-latin.woff2",
  variable: "--font-modelo-great-vibes",
  fallback: ["cursive"],
  display: "swap",
  preload: false,
  weight: "400",
});

/** As classes que definem as variáveis de letra de todos os modelos; o modelo escolhe qual usar em estilo.ts. */
export const CLASSES_DAS_FONTES = [fontePlayfair, fonteCormorant, fonteBodoni, fonteItaliana, fonteGreatVibes].map((f) => f.variable).join(" ");
