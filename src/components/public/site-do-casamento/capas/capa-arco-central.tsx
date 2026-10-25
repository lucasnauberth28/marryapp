// Capa do modelo Clássico: o arco com a foto (ou as iniciais), os nomes, a data, a contagem regressiva e os botões.
import { estiloDoSobretituloDaLanding } from "@/components/landing/styles";
import { ContagemRegressivaDoCasamento } from "@/components/public/wedding-site-countdown";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import type { DadosDoSite, PropriedadesDeLink } from "../dados-do-site";
import { NomesDoCasal, TextoDeIniciais } from "../pecas";
import { AcoesDaCapa } from "./acoes-da-capa";

function ArcoDaCapa({ site }: { site: DadosDoSite }) {
  return (
    <div className="arch relative aspect-[3/4] w-[260px] max-w-[80%] bg-areia outline outline-1 outline-offset-[6px] outline-rosa md:w-[360px] md:outline-offset-8">
      {site.coverUrl ? (
        <div className="arch absolute inset-0 overflow-hidden">
          <ImagemDaPessoa src={site.coverUrl} alt={`Foto de ${site.coupleNames}`} sizes="(min-width: 768px) 360px, 260px" priority className="hero-settle object-cover" />
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-ameixa">
          <span className="block h-px w-12 bg-rosa" aria-hidden="true" />
          <span className="font-display text-6xl leading-none md:text-7xl" aria-hidden="true"><TextoDeIniciais initials={site.initials} /></span>
          <span className="block h-px w-12 bg-rosa" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

export function CapaArcoCentral({ site, linkProps }: { site: DadosDoSite; linkProps: PropriedadesDeLink }) {
  const { s } = site;
  return (
    <section id="inicio" className="mx-auto flex max-w-[1120px] flex-col items-center gap-5 px-4 pb-12 pt-8 text-center md:gap-8 md:px-6 md:pb-24 md:pt-16">
      <ArcoDaCapa site={site} />
      <div className="flex max-w-full flex-col items-center gap-3 pt-2 md:pt-0">
        {s.subtitle?.trim() && <p className={estiloDoSobretituloDaLanding}>{s.subtitle.trim()}</p>}
        <h1 className="m-0 max-w-full font-display text-[52px] font-medium leading-[54px] tracking-[-0.02em] text-tinta text-balance md:[font-size:clamp(56px,8vw,96px)] md:leading-none">
          <NomesDoCasal names={site.coupleNames} />
        </h1>
        <p className="m-0 text-[17px] leading-7 text-tinta-suave md:text-xl">{site.whenWhere}</p>
      </div>
      {site.countdownTarget !== null && <ContagemRegressivaDoCasamento target={site.countdownTarget} />}
      <div className="flex flex-col items-center gap-3 text-tinta-suave"><AcoesDaCapa site={site} linkProps={linkProps} /></div>
    </section>
  );
}
