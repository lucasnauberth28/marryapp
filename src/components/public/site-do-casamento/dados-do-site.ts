// Tudo que a página precisa calcular a partir das configurações do casal: textos, links, o que mostrar e a ordem das faixas.
import type { CSSProperties } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { instanteDoCasamento } from "@/components/public/wedding-site-countdown";
import { estiloDoTemaDaMarca, obterIniciaisDoCasal } from "@/lib/casamento/wedding-format";
import { caminhoDoSiteDoCasamento } from "@/lib/casamento/wedding-links";
import type { ConfiguracoesDoSiteDoCasamento, DicaDoSite, ItemDaHistoria, PresenteDoSite, TomDaFaixa } from "./tipos";
import { fotosDaGaleria, modeloDoSite, type ModeloDoSite } from "./modelos/catalogo";
import { destaqueParaFundoEscuro, estiloDoModelo } from "./modelos/estilo";
import { diaDoCasamento, formatarHoraDoSite, interpretarPaleta, linhaDeDataELocal } from "./utilitarios";

interface EntradaDoSite {
  slug: string;
  settings: ConfiguracoesDoSiteDoCasamento | null;
  storyItems: ItemDaHistoria[];
  tips: DicaDoSite[];
  gifts: PresenteDoSite[];
  rsvpDeadline?: Date | string | null;
}

/** O design usa a ameixa como destaque; no site do casal, o destaque é a cor que os noivos escolheram, sobre as cores do modelo. */
function estiloDoTema(themeColor: string | null | undefined, modelo: ModeloDoSite): CSSProperties {
  const destaque = modelo.escuro ? destaqueParaFundoEscuro(themeColor || modelo.destaque) : estiloDoTemaDaMarca(themeColor || modelo.destaque);
  return estiloDoModelo(modelo.id, destaque);
}

function linksDoLocal(s: ConfiguracoesDoSiteDoCasamento) {
  const endereco = s.locationAddress?.trim() || "";
  const codificado = encodeURIComponent(endereco);
  return {
    address: endereco,
    mapsUrl: s.locationMapUrl || (endereco ? `https://www.google.com/maps/search/?api=1&query=${codificado}` : null),
    wazeUrl: s.wazeUrl || (endereco ? `https://waze.com/ul?q=${codificado}&navigate=yes` : null),
    uberUrl: s.uberUrl || (endereco ? `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${codificado}` : null),
  };
}

/** Quais seções aparecem: ligadas pelo casal e com conteúdo para mostrar. */
function secoesVisiveis(s: ConfiguracoesDoSiteDoCasamento, e: EntradaDoSite, locationName: string, address: string, storyCouplePhoto: string | null) {
  return {
    showStory: s.showStory !== false && (e.storyItems.length > 0 || !!storyCouplePhoto || !!s.welcomeMessage?.trim()),
    showLocation: s.showLocation !== false && (!!locationName || !!address),
    showDress: s.showDressCode !== false && (!!s.dressCodeTitle || !!s.dressCodeDesc),
    showTips: s.showTips !== false && e.tips.length > 0,
    showRsvp: s.showRsvp !== false,
    showMusic: s.showMusic !== false && !!s.spotifyPlaylistUrl,
    showGuestbook: s.showGuestbook !== false,
    showGallery: s.showGallery !== false && fotosDaGaleria(s.galleryUrls).length > 0,
    showGifts: s.showGifts !== false && e.gifts.length > 0,
    showGiftLink: s.showGifts !== false,
  };
}

type Secoes = ReturnType<typeof secoesVisiveis>;

/** As faixas alternam papel e linho na ordem em que aparecem; o mural fecha em areia. */
function faixasEmOrdem(v: Secoes) {
  const ids = [v.showStory && "historia", v.showGallery && "galeria", (v.showLocation || v.showDress) && "cerimonia", v.showTips && "dicas", v.showGifts && "presentes", v.showRsvp && "rsvp", v.showMusic && "musica"].filter(Boolean) as string[];
  return (id: string): TomDaFaixa => (ids.indexOf(id) % 2 === 0 ? "papel" : "linho");
}

function linksDoMenu(v: Secoes) {
  return [
    v.showStory && { href: "#historia", label: "Nossa história" },
    v.showGallery && { href: "#galeria", label: "Fotos" },
    v.showLocation && { href: "#cerimonia", label: "Cerimônia" },
    !v.showLocation && v.showDress && { href: "#cerimonia", label: "Traje" },
    v.showTips && { href: "#dicas", label: "Dicas" },
    v.showGifts && { href: "#presentes", label: "Presentes" },
    v.showGuestbook && { href: "#recados", label: "Recados" },
  ].filter(Boolean) as { href: string; label: string }[];
}

/** Datas por extenso: do casamento, do dia da semana e do prazo de confirmação. */
function textosDeData(s: ConfiguracoesDoSiteDoCasamento, rsvpDeadline?: Date | string | null) {
  const dia = diaDoCasamento(s.weddingDate), prazo = diaDoCasamento(rsvpDeadline);
  return {
    dateLabel: dia ? format(dia, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : null,
    weekdayLabel: dia ? format(dia, "EEEE, d 'de' MMMM", { locale: ptBR }) : null,
    deadlineLabel: prazo ? format(prazo, "d 'de' MMMM", { locale: ptBR }) : null,
  };
}

export function prepararDadosDoSite(e: EntradaDoSite) {
  const s = e.settings ?? {};
  const nomes = s.title?.trim() || "Nosso Casamento";
  const locationName = s.locationName?.trim() || "";
  const local = linksDoLocal(s);
  const datas = textosDeData(s, e.rsvpDeadline);
  // Foto da capa; sem ela, a foto do casal ocupa o arco (e não se repete em "Nossa história").
  const storyCouplePhoto = s.heroImageUrl ? s.couplePhotoUrl || null : null;
  const modelo = modeloDoSite(s.template);
  const visiveis = secoesVisiveis(s, e, locationName, local.address, storyCouplePhoto);
  return {
    s, coupleNames: nomes, initials: obterIniciaisDoCasal(nomes), ...datas, ...local, ...visiveis, locationName,
    countdownTarget: s.weddingDate ? instanteDoCasamento(new Date(s.weddingDate), s.ceremonyTime) : null,
    palette: interpretarPaleta(s.dressCodePalette), themeStyle: estiloDoTema(s.themeColor, modelo), modelo, galleryPhotos: fotosDaGaleria(s.galleryUrls),
    coverUrl: s.heroImageUrl || s.couplePhotoUrl || null, storyCouplePhoto,
    toneOf: faixasEmOrdem(visiveis), navLinks: linksDoMenu(visiveis),
    rsvpHref: caminhoDoSiteDoCasamento(e.slug, "rsvp"), giftsHref: caminhoDoSiteDoCasamento(e.slug, "presentes"),
    whenWhere: linhaDeDataELocal(datas.dateLabel, locationName),
    ceremonyTime: formatarHoraDoSite(s.ceremonyTime), receptionTime: formatarHoraDoSite(s.receptionTime),
  };
}

export type DadosDoSite = ReturnType<typeof prepararDadosDoSite>;

/** Na prévia do editor, links não navegam. */
export function propriedadesDeLink(preview: boolean) {
  return preview ? { tabIndex: -1, "aria-disabled": true, onClick: (e: React.MouseEvent) => e.preventDefault() } : {};
}

export type PropriedadesDeLink = ReturnType<typeof propriedadesDeLink>;
