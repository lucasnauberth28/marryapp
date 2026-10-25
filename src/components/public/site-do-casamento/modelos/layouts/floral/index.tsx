// Modelo Floral rosé: tons de pêssego e coral, ramos de flores em traço e ondas entre as faixas.
import Link from "next/link";
import { estiloDoBotao } from "@/components/landing/styles";
import { DuvidasEmColunas } from "./duvidas";
import { SecaoDeRecados } from "../../../secao-recados";
import { Foto, fotosDoCasal } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";
import { CapaFloral } from "./capa";
import { Onda, Ramo } from "./ornamentos";
import { BoasVindas, NossaHistoria, OQueEsperar, PresentesFloral } from "./secoes";

export function LayoutFloral({ slug, site, linkProps, historia, dicas, presentes, recados, preview }: PropriedadesDoLayout) {
  const fotos = fotosDoCasal(site, historia);
  return (
    <div className="bg-linho">
      <CapaFloral site={site} linkProps={linkProps} preview={preview} foto={fotos.foto(0)} />
      <div className="-mt-px bg-papel">
        <Onda cor="var(--color-linho)" invertida />
        {site.showStory && <BoasVindas site={site} fotos={fotos} />}
        {(site.showLocation || site.showDress) && <OQueEsperar site={site} />}
      </div>
      <Onda cor="var(--color-areia)" />
      {site.showStory && <NossaHistoria historia={historia} fotos={fotos} />}
      {site.showGifts && presentes.length > 0 && <PresentesFloral site={site} presentes={presentes} linkProps={linkProps} />}
      {site.showTips && dicas.length > 0 && <DuvidasEmColunas dicas={dicas} />}
      {site.showGuestbook && <SecaoDeRecados slug={slug} recadosIniciais={recados} preview={preview} />}
      {site.showRsvp && (
        <section id="confirmar" className="mx-auto grid max-w-[1200px] items-center gap-8 px-4 py-20 md:grid-cols-2 md:px-8">
          <div className="flex flex-col items-start gap-5"><h2 className="m-0 font-display text-[clamp(32px,4.4vw,52px)] font-semibold leading-[1.08] text-tinta">Contamos com você?</h2><p className="m-0 max-w-[44ch] leading-7 text-tinta-suave">{site.deadlineLabel ? `Confirme até ${site.deadlineLabel}. ` : ""}Leva menos de um minuto: é só informar o seu WhatsApp.</p><Link href={site.rsvpHref} className={estiloDoBotao.primary} {...linkProps}>Confirmar presença</Link></div>
          <div className="relative mx-auto aspect-[5/4] w-full max-w-[460px] overflow-hidden bg-areia" style={{ borderRadius: "28px 28px 160px 28px" }}><Foto src={fotos.foto(3)} sizes="460px" /><Ramo className="absolute -bottom-2 -left-4 h-[160px] text-papel" /></div>
        </section>
      )}
      <footer className="px-4 py-12 text-center"><p className="m-0 font-display text-3xl font-semibold text-tinta">{site.coupleNames}</p><p className="m-0 mt-1 text-sm text-tinta-suave">{site.dateLabel ? `${site.dateLabel} · ` : ""}Feito com Aceito</p></footer>
    </div>
  );
}
