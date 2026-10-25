// Modelo Monocromático: preto e branco, Bodoni de caixa alta, fios finos e cantos retos.
import { SecaoDeRecados } from "../../../secao-recados";
import { fotosDoCasal } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";
import { CapaMonocromo } from "./capa";
import { DicasDeViagem, GaleriaEmPretoEBranco, PresentesEmTabela, RodapePreto } from "./finais";
import { BoasVindas, ConviteEmDuasMetades, LinhaDoTempo } from "./secoes";

export function LayoutMonocromo({ slug, site, linkProps, historia, dicas, presentes, recados, preview }: PropriedadesDoLayout) {
  const fotos = fotosDoCasal(site, historia);
  return (
    <div>
      <CapaMonocromo site={site} preview={preview} foto={fotos.foto(0)} />
      {site.showStory && <BoasVindas site={site} fotos={fotos} />}
      {(site.showLocation || site.showDress) && <LinhaDoTempo site={site} />}
      <div className="pt-20 md:pt-28">{site.showGallery && <GaleriaEmPretoEBranco fotos={fotos} />}</div>
      {site.showGifts && presentes.length > 0 && <PresentesEmTabela site={site} presentes={presentes} linkProps={linkProps} />}
      {site.showTips && dicas.length > 0 && <DicasDeViagem dicas={dicas} />}
      {site.showGuestbook && <SecaoDeRecados slug={slug} recadosIniciais={recados} preview={preview} variante="linhas" />}
      {site.showRsvp && <ConviteEmDuasMetades site={site} linkProps={linkProps} foto={fotos.foto(5)} />}
      <RodapePreto site={site} />
    </div>
  );
}
