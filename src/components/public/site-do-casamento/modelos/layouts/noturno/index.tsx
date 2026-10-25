// Modelo Noturno: fundo escuro, letras finas e cartões de vidro com fio dourado.
import { SecaoDeRecados } from "../../../secao-recados";
import { fotosDoCasal } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";
import { TresMomentos, FileiraDeCartoes } from "./cartoes";
import { CapaNoturna } from "./capa";
import { ConviteNoturno, DicasDeVidro, Historia, PresentesDeVidro, RodapeNoturno } from "./finais";

export function LayoutNoturno({ slug, site, linkProps, historia, dicas, presentes, recados, preview }: PropriedadesDoLayout) {
  const fotos = fotosDoCasal(site, historia);
  return (
    <div className="bg-linho">
      <CapaNoturna site={site} linkProps={linkProps} preview={preview} foto={fotos.foto(0)} />
      {(site.showLocation || site.showDress) && <TresMomentos site={site} fotos={fotos} />}
      {site.showStory && <FileiraDeCartoes site={site} recados={recados} fotos={fotos} />}
      {site.showStory && <Historia historia={historia} />}
      {site.showGifts && presentes.length > 0 && <PresentesDeVidro site={site} presentes={presentes} linkProps={linkProps} />}
      {site.showTips && dicas.length > 0 && <DicasDeVidro dicas={dicas} />}
      {site.showGuestbook && <SecaoDeRecados slug={slug} recadosIniciais={recados} preview={preview} variante="vidro" />}
      {site.showRsvp && <ConviteNoturno site={site} linkProps={linkProps} />}
      <RodapeNoturno site={site} />
    </div>
  );
}
