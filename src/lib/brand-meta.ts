import type { Metadata } from "next";

/** Imagem de compartilhamento do Aceito (1200x630, gerada por scripts/gerar-marca-png.mjs). Só nas páginas institucionais:
 *  o site do casal e o convite não a usam, para o link do casal não aparecer com a mensagem da marca. */
const OG_IMAGE = {
  url: "/brand/aceito-og.png",
  width: 1200,
  height: 630,
  alt: "Aceito. O casamento de vocês, mais simples de organizar.",
};

/** Open Graph e cartão do X/Twitter com a imagem da marca. `url` é relativo ao metadataBase. */
export function brandShare({ title, description, url }: { title: string; description: string; url: string }): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: { type: "website", locale: "pt_BR", siteName: "Aceito", url, title, description, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}
