// Modelo Papel rasgado: folhas de papel craft rasgadas sobre fotos de página inteira, azul-ardósia e letras altas.
import { SecaoDeRecados } from "../../../secao-recados";
import { fotosDoCasal } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";
import { CapaDoPapel } from "./capa";
import { PerguntasEmPilulas, PolaroidsDePresentes, ConviteFinal } from "./finais";
import { BandaDaProgramacao, FolhaDaHistoria, FolhaDosMomentos } from "./folhas";

export function LayoutPapel({ slug, site, linkProps, historia, dicas, presentes, recados, preview }: PropriedadesDoLayout) {
  const fotos = fotosDoCasal(site, historia);
  return (
    <div className="bg-areia">
      <CapaDoPapel site={site} linkProps={linkProps} preview={preview} foto={fotos.foto(0)} />
      {site.showStory && <FolhaDaHistoria site={site} linkProps={linkProps} fotos={fotos} />}
      {site.showStory && <FolhaDosMomentos historia={historia} fotos={fotos} />}
      {(site.showLocation || site.showDress) && <BandaDaProgramacao site={site} fotos={fotos} />}
      {site.showGifts && presentes.length > 0 && <PolaroidsDePresentes site={site} presentes={presentes} linkProps={linkProps} />}
      {site.showTips && dicas.length > 0 && <PerguntasEmPilulas dicas={dicas} />}
      {site.showGuestbook && <SecaoDeRecados slug={slug} recadosIniciais={recados} preview={preview} />}
      {site.showRsvp && <ConviteFinal site={site} linkProps={linkProps} foto={fotos.foto(6)} />}
    </div>
  );
}
