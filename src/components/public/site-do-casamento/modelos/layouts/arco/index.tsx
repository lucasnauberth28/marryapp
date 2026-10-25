// Modelo Arco bege: bege quente, fotos em arco e uma faixa verde-oliva, com a capa dividida em três colunas.
import { SecaoDeRecados } from "../../../secao-recados";
import { fotosDoCasal } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";
import { CapaDoArco } from "./capa";
import { ConviteSobreAFoto, DuvidasEmBarras, Essencia, MemoriasEmLinhas, PresentesEmCartoes, RodapeOliva } from "./finais";
import { BarraDeResumo, FaixaDeNumeros, QuatroMomentos, SobreNos } from "./secoes";

export function LayoutArco({ slug, site, linkProps, historia, dicas, presentes, recados, preview }: PropriedadesDoLayout) {
  const fotos = fotosDoCasal(site, historia);
  return (
    <div>
      <CapaDoArco site={site} linkProps={linkProps} preview={preview} fotos={fotos} />
      <BarraDeResumo site={site} />
      {site.showStory && <SobreNos site={site} fotos={fotos} linkProps={linkProps} />}
      {(site.showLocation || site.showDress) && <QuatroMomentos site={site} />}
      <FaixaDeNumeros site={site} momentos={historia.length} />
      {site.showGallery && <div className="pt-20 md:pt-28"><Essencia site={site} fotos={fotos} /></div>}
      {site.showStory && <MemoriasEmLinhas historia={historia} />}
      {site.showGifts && presentes.length > 0 && <PresentesEmCartoes site={site} presentes={presentes} linkProps={linkProps} />}
      {site.showTips && dicas.length > 0 && <DuvidasEmBarras dicas={dicas} fotos={fotos} />}
      {site.showGuestbook && <SecaoDeRecados slug={slug} recadosIniciais={recados} preview={preview} />}
      {site.showRsvp && <ConviteSobreAFoto site={site} linkProps={linkProps} foto={fotos.foto(9)} />}
      <RodapeOliva site={site} />
    </div>
  );
}
