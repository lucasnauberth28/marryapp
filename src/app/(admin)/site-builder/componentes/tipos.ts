import type { ConfiguracoesDoSiteDoCasamento } from "@/components/public/site-do-casamento/tipos";

export interface ItemDaHistoria {
  id: string;
  title: string;
  dateLabel?: string | null;
  description: string;
  imageUrl?: string | null;
}

export interface Dica {
  id: string;
  category: string;
  title: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  linkUrl?: string | null;
  discountCode?: string | null;
}

export interface PresenteDaPrevia {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  imageUrl?: string | null;
}

export type IdDaSecao = "TEMPLATE" | "COVER" | "GALLERY" | "PROGRAM" | "STORY" | "LOCATION" | "DRESS" | "TIPS" | "RSVP" | "MUSIC" | "GIFTS" | "GUESTBOOK";
export type ChaveDaConfiguracao = keyof ConfiguracoesDoSiteDoCasamento;
export type CampoDeFoto = "heroImageUrl" | "couplePhotoUrl";
export type ItemParaExcluir = { tipo: "story" | "tip"; id: string; title: string };

/** Seções na ordem em que aparecem no site. `key` liga e desliga a seção no site (a capa está sempre visível). */
export const SECOES: { id: IdDaSecao; label: string; key?: ChaveDaConfiguracao; desc?: string }[] = [
  { id: "TEMPLATE", label: "Modelo do site" },
  { id: "COVER", label: "Capa" },
  { id: "STORY", label: "Nossa história", key: "showStory", desc: "Mensagem de boas-vindas, foto do casal e momentos marcantes." },
  { id: "GALLERY", label: "Galeria de fotos", key: "showGallery", desc: "Até 8 fotos de vocês, na ordem que escolherem." },
  { id: "PROGRAM", label: "Programação do dia", desc: "Os momentos do casamento (jantar, cerimônia, festa...) com dia, horário e local." },
  { id: "LOCATION", label: "Cerimônia e recepção", key: "showLocation", desc: "Endereço, horários e botões de rota (Maps, Waze, Uber)." },
  { id: "DRESS", label: "Traje", key: "showDressCode", desc: "Orientação de traje e cores sugeridas." },
  { id: "TIPS", label: "Dicas aos convidados", key: "showTips", desc: "Hospedagem, beleza e transporte indicados." },
  { id: "RSVP", label: "Confirmação de presença", key: "showRsvp", desc: "Botão e chamada para o convidado confirmar." },
  { id: "MUSIC", label: "Playlist", key: "showMusic", desc: "Link para a playlist do casamento." },
  { id: "GIFTS", label: "Presentes em dinheiro", key: "showGifts", desc: "Presentes em destaque, com botão para o convidado presentear por Pix ou cartão." },
  { id: "GUESTBOOK", label: "Mural de recados", key: "showGuestbook", desc: "Espaço para os convidados deixarem mensagens." },
];

export const ROTULOS_DAS_DICAS: Record<string, string> = {
  HOTEL: "Hospedagem",
  SALON: "Beleza",
  TRANSFER: "Transporte",
  DRESS: "Trajes",
};

// Campos que o editor envia ao servidor (o resto do registro é ignorado)
export const CHAVES_EDITAVEIS = [
  "title", "subtitle", "weddingDate", "ceremonyTime", "receptionTime", "locationName", "locationAddress",
  "locationMapUrl", "wazeUrl", "uberUrl", "themeColor", "heroImageUrl", "couplePhotoUrl", "dressCodeTitle",
  "dressCodeDesc", "dressCodePalette", "spotifyPlaylistUrl", "welcomeMessage",
  "showStory", "showLocation", "showDressCode", "showTips", "showGifts", "showRsvp", "showGuestbook", "showMusic",
  "showGallery", "template", "galleryUrls", "programJson",
] as const;

export const NOVO_MOMENTO = { title: "", dateLabel: "", description: "" };
export const NOVA_DICA = { category: "HOTEL", title: "", description: "", address: "", phone: "", linkUrl: "", discountCode: "" };
