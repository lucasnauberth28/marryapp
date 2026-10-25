// Do modelo escolhido às variáveis de cor e de letra do site. O site do casal usa só tokens (linho, papel, areia, tinta...),
// então trocar os tokens na raiz muda a página inteira sem tocar nas seções.
import type { CSSProperties } from "react";
import { modeloDoSite, type FonteDoModelo, type ModeloDoSite } from "./catalogo.ts";

function rgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminancia(cor: [number, number, number]) {
  const [r, g, b] = cor.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Texto sobre uma superfície da cor de destaque: branco ou quase preto, o que tiver mais contraste. */
export function corDoTextoSobre(destaque: string): string {
  const cor = rgb(destaque);
  if (!cor) return "#FFFFFF";
  const claro = luminancia(cor);
  return (1.05 / (claro + 0.05) >= (claro + 0.05) / 0.056 ? "#FFFFFF" : "#17110C");
}

const FAMILIAS: Record<Exclude<FonteDoModelo, "padrao">, string> = {
  playfair: "var(--font-modelo-playfair), Georgia, serif",
  cormorant: "var(--font-modelo-cormorant), Georgia, serif",
  bodoni: "var(--font-modelo-bodoni), Didot, Georgia, serif",
  italiana: "var(--font-modelo-italiana), Georgia, serif",
};

/** Variáveis de cor e de letra do modelo, sem a cor de destaque (essa é do casal). */
export function variaveisDoModelo(modelo: ModeloDoSite): Record<string, string> {
  const { paleta } = modelo;
  const base: Record<string, string> = {
    "--color-linho": paleta.fundo,
    "--color-papel": paleta.cartao,
    "--color-areia": paleta.faixa,
    "--color-linha": paleta.linha,
    "--color-linha-forte": `color-mix(in oklab, ${paleta.texto} 45%, ${paleta.fundo})`,
    "--color-tinta": paleta.texto,
    "--color-tinta-suave": paleta.apoio,
  };
  if (modelo.fonte !== "padrao") base["--font-display"] = FAMILIAS[modelo.fonte];
  return base;
}

/** Cor de destaque sobre fundo escuro: vale como foi escolhida (a correção de leitura é para fundo claro). */
export function destaqueParaFundoEscuro(hex: string): Record<string, string> {
  const cor = rgb(hex) ? hex : "#C9A86A";
  return { "--color-brand": cor, "--color-brand-500": cor, "--color-brand-600": `color-mix(in oklab, ${cor} 80%, white)`, "--primary": cor, "--ring": cor };
}

/** O estilo da raiz do site: tokens do modelo e, por cima, a cor de destaque do casal (já ajustada para leitura). */
export function estiloDoModelo(idDoModelo: unknown, destaque: Record<string, string>): CSSProperties {
  const modelo = modeloDoSite(idDoModelo);
  const cor = destaque["--color-brand"];
  const suave = modelo.escuro ? `color-mix(in oklab, ${cor} 22%, ${modelo.paleta.fundo})` : `color-mix(in oklab, ${cor} 12%, ${modelo.paleta.fundo})`;
  return {
    ...variaveisDoModelo(modelo),
    ...destaque,
    "--color-ameixa": cor,
    "--color-ameixa-hover": destaque["--color-brand-600"],
    "--color-ameixa-suave": suave,
    "--color-on-ameixa": corDoTextoSobre(cor),
    "--color-rosa": `color-mix(in oklab, ${cor} 40%, ${modelo.paleta.fundo})`,
  } as CSSProperties;
}
