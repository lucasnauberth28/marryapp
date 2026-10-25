"use client";
// O site público do casal (e a prévia do editor): junta o cabeçalho, a capa e as seções que o casal deixou ligadas.
import { prepararDadosDoSite, propriedadesDeLink } from "./dados-do-site";
import { BarraFixaDoCelular, RodapeDoSite } from "./rodape";
import { CabecalhoDoSite } from "./cabecalho";
import { CapaDoSite } from "./capa";
import { SecaoDaCerimonia } from "./secao-cerimonia";
import { SecaoDaGaleria } from "./secao-galeria";
import { SecaoDaHistoria } from "./secao-historia";
import { SecaoDaMusica } from "./secao-musica";
import { SecaoDeConfirmacao } from "./secao-confirmacao";
import { SecaoDeDicas } from "./secao-dicas";
import { SecaoDePresentes } from "./secao-presentes";
import { SecaoDeRecados } from "./secao-recados";
import { CLASSES_DAS_FONTES } from "./modelos/fontes";
import { LAYOUTS } from "./modelos/layouts";
import { IniciaisDoCasal } from "./modelos/layouts/comum";
import "./modelos/modelos.css";
import type { PropriedadesDaVisaoDoSiteDoCasamento } from "./tipos";

export function VisaoDoSiteDoCasamento({ slug, settings, storyItems, tips, guestbookEntries, gifts, rsvpDeadline, preview = false }: PropriedadesDaVisaoDoSiteDoCasamento) {
  const site = prepararDadosDoSite({ slug, settings, storyItems, tips, gifts, rsvpDeadline });
  const linkProps = propriedadesDeLink(preview);
  const LayoutDoModelo = LAYOUTS[site.modelo.id];
  return (
    <div style={site.themeStyle} data-modelo={site.modelo.id} className={`${CLASSES_DAS_FONTES} min-h-screen overflow-x-clip bg-linho font-sans text-tinta antialiased selection:bg-ameixa/20`}>
      {LayoutDoModelo ? (
        <IniciaisDoCasal.Provider value={site.initials}>
          <LayoutDoModelo slug={slug} site={site} linkProps={linkProps} historia={storyItems} dicas={tips} presentes={gifts} recados={guestbookEntries} preview={preview} />
        </IniciaisDoCasal.Provider>
      ) : (
        <>
          <CabecalhoDoSite site={site} linkProps={linkProps} preview={preview} />
          <CapaDoSite site={site} linkProps={linkProps} />
          {site.showStory && <SecaoDaHistoria site={site} itens={storyItems} />}
          {site.showGallery && <SecaoDaGaleria site={site} />}
          {(site.showLocation || site.showDress) && <SecaoDaCerimonia site={site} linkProps={linkProps} />}
          {site.showTips && <SecaoDeDicas site={site} dicas={tips} linkProps={linkProps} />}
          {site.showGifts && <SecaoDePresentes site={site} presentes={gifts} linkProps={linkProps} />}
          {site.showRsvp && <SecaoDeConfirmacao site={site} linkProps={linkProps} />}
          {site.showMusic && <SecaoDaMusica site={site} linkProps={linkProps} />}
          {site.showGuestbook && <SecaoDeRecados slug={slug} recadosIniciais={guestbookEntries} preview={preview} />}
        </>
      )}
      {!LayoutDoModelo && <RodapeDoSite site={site} />}
      {!preview && <BarraFixaDoCelular site={site} />}
    </div>
  );
}
