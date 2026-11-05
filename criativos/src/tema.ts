// Cores, fontes e medidas da marca (docs/marca). Tudo em px de um quadro de referência de 1080 no lado menor.
import { loadFont } from "@remotion/fonts";
import { staticFile, useVideoConfig } from "remotion";

export const COR = {
  tinta: "#1F1A1D",
  tintaSuave: "#5F585C",
  ameixa: "#5E2B4E",
  ameixaSuave: "#F4EAF1",
  papel: "#FFFFFF",
  linho: "#FCFBFA",
  linhoQuente: "#F7F3EC",
  nevoa: "#F7F1F5",
  linha: "#E8E2E5",
  petala: "#E9B8C2",
  salvia: "#5D6F57",
  champanhe: "#B8935A",
  sucesso: "#1C7A4A",
  sucessoSuave: "#E4F2E9",
} as const;

export const FONTE = { titulo: "Urbanist, sans-serif", texto: "Geist, sans-serif" } as const;

/** Carrega as fontes da marca antes do primeiro quadro (o Remotion espera a promessa). */
export const fontesProntas = Promise.all([
  loadFont({ family: "Urbanist", url: staticFile("fontes/urbanist-latin.woff2"), weight: "100 900" }),
  loadFont({ family: "Geist", url: staticFile("fontes/geist-latin.woff2"), weight: "100 900" }),
]);

export type TipoDeFormato = "horizontal" | "vertical" | "quadrado";

/** O formato do quadro e a unidade `u` (1 = 1 px num quadro de 1080 no lado menor). */
export function useFormato() {
  const { width, height } = useVideoConfig();
  const tipo: TipoDeFormato = width > height ? "horizontal" : width < height ? "vertical" : "quadrado";
  return { tipo, largura: width, altura: height, u: Math.min(width, height) / 1080 };
}

/** Os dois casais das fotos: os nomes acompanham a foto do fechamento. */
export type Casal = "noivas" | "noivos";
export const NOMES_DO_CASAL: Record<Casal, string> = { noivas: "Ana & Bia", noivos: "Clara & Rafael" };
