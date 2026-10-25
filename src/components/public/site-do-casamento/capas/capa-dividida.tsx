// Capa dividida: o texto à esquerda e a foto à direita. Usada pelos modelos Arco bege e Floral rosé.
import { estiloDoSobretituloDaLanding } from "@/components/landing/styles";
import { ContagemRegressivaDoCasamento } from "@/components/public/wedding-site-countdown";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import type { DadosDoSite, PropriedadesDeLink } from "../dados-do-site";
import { NomesDoCasal, TextoDeIniciais } from "../pecas";
import { AcoesDaCapa } from "./acoes-da-capa";

function FotoDaCapa({ site }: { site: DadosDoSite }) {
  return (
    <div className="relative mx-auto w-full max-w-[420px] justify-self-center">
      <div className="arch relative aspect-[4/5] bg-areia outline outline-1 outline-offset-[8px] outline-rosa">
        {site.coverUrl ? (
          <div className="arch absolute inset-0 overflow-hidden">
            <ImagemDaPessoa src={site.coverUrl} alt={`Foto de ${site.coupleNames}`} sizes="(min-width: 768px) 420px, 90vw" priority className="hero-settle object-cover" />
          </div>
        ) : (
          <span className="absolute inset-0 grid place-items-center font-display text-7xl text-ameixa" aria-hidden="true"><TextoDeIniciais initials={site.initials} /></span>
        )}
      </div>
    </div>
  );
}

export function CapaDividida({ site, linkProps }: { site: DadosDoSite; linkProps: PropriedadesDeLink }) {
  const { s } = site;
  return (
    <section id="inicio" className="mx-auto grid max-w-[1120px] items-center gap-10 px-4 pb-14 pt-8 md:grid-cols-[1.1fr_1fr] md:gap-16 md:px-6 md:pb-24 md:pt-16">
      <div className="flex min-w-0 flex-col items-start gap-5 text-left md:gap-6">
        {s.subtitle?.trim() && <p className={estiloDoSobretituloDaLanding}>{s.subtitle.trim()}</p>}
        <h1 className="m-0 max-w-full font-display text-[52px] font-medium leading-[1.02] tracking-[-0.02em] text-tinta text-balance md:[font-size:clamp(56px,6.4vw,92px)]">
          <NomesDoCasal names={site.coupleNames} />
        </h1>
        <p className="m-0 max-w-[48ch] text-[17px] leading-7 text-tinta-suave md:text-xl">{site.whenWhere}</p>
        {site.countdownTarget !== null && <ContagemRegressivaDoCasamento target={site.countdownTarget} />}
        <div className="flex flex-col items-start gap-3 text-tinta-suave"><AcoesDaCapa site={site} linkProps={linkProps} centralizar={false} /></div>
      </div>
      <FotoDaCapa site={site} />
    </section>
  );
}
