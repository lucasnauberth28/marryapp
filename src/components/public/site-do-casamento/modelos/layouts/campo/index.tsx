// Modelo Campo: verde-sálvia, nomes em letra manuscrita, calendários verdes e códigos QR.
import { SecaoDeRecados } from "../../../secao-recados";
import { fotosDoCasal } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";
import { CapaDoCampo } from "./capa";
import { ConviteDoCampo, DicasDoCampo, PresentesDoCampo, RodapeDoCampo } from "./finais";
import { BoasVindas, OrdemDoDia } from "./secoes";

export function LayoutCampo({ slug, site, linkProps, historia, dicas, presentes, recados, preview }: PropriedadesDoLayout) {
  const fotos = fotosDoCasal(site, historia);
  return (
    <div>
      <CapaDoCampo site={site} linkProps={linkProps} preview={preview} foto={fotos.foto(0)} />
      {site.showStory && <BoasVindas site={site} fotos={fotos} />}
      {(site.showLocation || site.showDress) && <OrdemDoDia site={site} />}
      {site.showGifts && presentes.length > 0 && <PresentesDoCampo site={site} presentes={presentes} linkProps={linkProps} />}
      {site.showTips && dicas.length > 0 && <DicasDoCampo dicas={dicas} />}
      {site.showGuestbook && <SecaoDeRecados slug={slug} recadosIniciais={recados} preview={preview} />}
      {site.showRsvp && <ConviteDoCampo site={site} linkProps={linkProps} foto={fotos.foto(5)} />}
      <RodapeDoCampo site={site} />
    </div>
  );
}
