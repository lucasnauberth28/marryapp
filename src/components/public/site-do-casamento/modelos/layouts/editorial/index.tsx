// Modelo Editorial: capa de revista, texto em colunas, fios finos e quase nenhuma caixa.
import { SecaoDeRecados } from "../../../secao-recados";
import { fotosDoCasal } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";
import { CapaEditorial } from "./capa";
import { ConviteEditorial, DicasEmTexto, PresentesEmLinhas, RodapeEditorial } from "./finais";
import { FimDeSemana, NossaHistoria } from "./secoes";

export function LayoutEditorial({ slug, site, linkProps, historia, dicas, presentes, recados, preview }: PropriedadesDoLayout) {
  const fotos = fotosDoCasal(site, historia);
  return (
    <div>
      <CapaEditorial site={site} linkProps={linkProps} preview={preview} foto={fotos.foto(0)} />
      {site.showStory && <NossaHistoria site={site} historia={historia} fotos={fotos} />}
      {(site.showLocation || site.showDress) && <FimDeSemana site={site} />}
      {site.showGifts && presentes.length > 0 && <PresentesEmLinhas site={site} presentes={presentes} linkProps={linkProps} />}
      {site.showTips && dicas.length > 0 && <DicasEmTexto dicas={dicas} />}
      {site.showGuestbook && <SecaoDeRecados slug={slug} recadosIniciais={recados} preview={preview} variante="linhas" />}
      {site.showRsvp && <ConviteEditorial site={site} linkProps={linkProps} foto={fotos.foto(4)} />}
      <RodapeEditorial site={site} />
    </div>
  );
}
