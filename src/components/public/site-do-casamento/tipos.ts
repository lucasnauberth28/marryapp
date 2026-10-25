// Tipos e constantes do site público do casal.
import { Bus, Hotel, Scissors, Shirt } from "lucide-react";

export interface ConfiguracoesDoSiteDoCasamento {
  title?: string | null;
  subtitle?: string | null;
  weddingDate?: Date | string | null;
  ceremonyTime?: string | null;
  receptionTime?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  locationMapUrl?: string | null;
  wazeUrl?: string | null;
  uberUrl?: string | null;
  themeColor?: string | null;
  heroImageUrl?: string | null;
  couplePhotoUrl?: string | null;
  dressCodeTitle?: string | null;
  dressCodeDesc?: string | null;
  dressCodePalette?: string | null;
  spotifyPlaylistUrl?: string | null;
  welcomeMessage?: string | null;
  showStory?: boolean;
  showLocation?: boolean;
  showDressCode?: boolean;
  showTips?: boolean;
  showGifts?: boolean;
  showRsvp?: boolean;
  showGuestbook?: boolean;
  showMusic?: boolean;
  showGallery?: boolean;
  /** Modelo do site (modelos/catalogo.ts). */
  template?: string | null;
  /** Fotos da galeria, em JSON (lista de endereços). */
  galleryUrls?: string | null;
  /** Programação do casamento, em JSON (lista de momentos). */
  programJson?: string | null;
}

export interface ItemDaHistoria {
  id: string;
  title: string;
  dateLabel?: string | null;
  description: string;
  imageUrl?: string | null;
}

export interface DicaDoSite {
  id: string;
  category: string;
  title: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  linkUrl?: string | null;
  discountCode?: string | null;
}

export interface RecadoDoLivro {
  id: string;
  authorName: string;
  message: string;
  createdAt: Date | string;
}

export interface PresenteDoSite {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  imageUrl?: string | null;
}

export interface PropriedadesDaVisaoDoSiteDoCasamento {
  /** Endereço do casamento (/casamento/<slug>): links de RSVP, presentes e o mural usam este casamento. */
  slug: string;
  settings: ConfiguracoesDoSiteDoCasamento | null;
  storyItems: ItemDaHistoria[];
  tips: DicaDoSite[];
  guestbookEntries: RecadoDoLivro[];
  gifts: PresenteDoSite[];
  rsvpDeadline?: Date | string | null;
  /** Prévia no editor: desativa links e formulários. */
  preview?: boolean;
}

export const CATEGORIAS_DE_DICAS: Record<string, { label: string; icon: typeof Hotel }> = {
  HOTEL: { label: "Hospedagem", icon: Hotel },
  SALON: { label: "Beleza", icon: Scissors },
  TRANSFER: { label: "Transporte", icon: Bus },
  DRESS: { label: "Trajes", icon: Shirt },
};

/** Recados mostrados antes do "Ver todos". */
export const PREVIA_DO_LIVRO_DE_RECADOS = 6;

export type TomDaFaixa = "papel" | "linho" | "areia";
