// Arco bege, capa: o texto à esquerda, a foto em arco no centro com o selo giratório e a galeria pequena à direita.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { CabecalhoDoModelo, DiasRestantes, Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";

const AREIA_QUENTE = "bg-[#CDB68A] text-[#2E211C]";

/** Texto em círculo em volta da seta: o selo que leva a confirmar a presença. */
function SeloGiratorio({ href, linkProps }: { href: string; linkProps: PropriedadesDoLayout["linkProps"] }) {
  return (
    <Link href={href} aria-label="Confirmar presença" className="absolute -bottom-6 left-1/2 grid size-[112px] -translate-x-1/2 place-items-center rounded-full bg-[#CDB68A] text-[#2E211C] no-underline" {...linkProps}>
      <svg viewBox="0 0 120 120" className="selo-gira absolute inset-0" aria-hidden="true">
        <defs><path id="circulo-do-selo" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" /></defs>
        <text className="fill-current text-[11px] font-semibold uppercase tracking-[0.22em]"><textPath href="#circulo-do-selo">Confirme a sua presença · Confirme a sua presença ·</textPath></text>
      </svg>
      <ArrowRight className="size-6 -rotate-45" aria-hidden="true" />
    </Link>
  );
}

function Etiquetas({ site }: { site: PropriedadesDoLayout["site"] }) {
  const itens = [site.dateLabel, site.locationName, site.s.dressCodeTitle].filter(Boolean) as string[];
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
      {itens.map((t) => <li key={t} className={`${AREIA_QUENTE} rounded-full px-3 py-1.5 text-xs font-semibold`}>{t}</li>)}
    </ul>
  );
}

export function CapaDoArco({ site, linkProps, preview, fotos }: Pick<PropriedadesDoLayout, "site" | "linkProps" | "preview"> & { fotos: { foto: (i: number) => string | null } }) {
  const [primeiro, ...resto] = site.coupleNames.split(/\s+(?:&|\+|e)\s+/i);
  return (
    <div id="inicio">
      <CabecalhoDoModelo
        marca={<span className="font-display text-2xl text-tinta">{site.initials}</span>}
        links={site.navLinks}
        acao={site.showRsvp ? <Link href={site.rsvpHref} className={`${estiloDoBotao.primary} ${estiloDoBotao.sm}`} {...linkProps}>Confirmar presença</Link> : null}
        classeDosLinks="text-sm font-semibold text-tinta hover:text-ameixa"
        classeDoPainel="bg-linho border-b border-linha"
        className="relative"
        preview={preview}
      />
      <section className="mx-auto grid max-w-[1200px] gap-10 px-4 pb-8 pt-8 md:px-8 lg:grid-cols-[1fr_minmax(300px,380px)_1fr] lg:items-center lg:gap-12">
        <div className="flex flex-col items-start gap-6 lg:order-1">
          <h1 className="m-0 font-display text-[clamp(44px,6vw,76px)] font-medium leading-[1.04] tracking-[-0.02em] text-tinta">{primeiro}{resto.length > 0 ? <><br /><span className="text-ameixa">&amp;</span> {resto.join(" e ")}</> : null}</h1>
          <p className="m-0 max-w-[36ch] text-base leading-7 text-tinta-suave">{site.s.subtitle?.trim() || site.whenWhere}</p>
          {site.showRsvp && <Link href={site.rsvpHref} className={estiloDoBotao.primary} {...linkProps}>Confirmar presença <ArrowRight className="size-4" aria-hidden="true" /></Link>}
          <p className="m-0 flex items-baseline gap-2 text-sm text-tinta-suave"><DiasRestantes alvo={site.countdownTarget} className="font-display text-3xl text-tinta" /> dias para o grande dia</p>
        </div>
        <div className="relative mx-auto w-full max-w-[380px] pb-8 lg:order-2">
          <div className="arch relative aspect-[3/5] overflow-hidden outline outline-1 outline-offset-[10px] outline-rosa"><Foto src={fotos.foto(0)} alt={`Foto de ${site.coupleNames}`} sizes="380px" priority className="hero-settle" /></div>
          {site.showRsvp && <SeloGiratorio href={site.rsvpHref} linkProps={linkProps} />}
        </div>
        <div className="flex flex-col gap-4 lg:order-3">
          <p className="m-0 text-sm font-semibold text-tinta">Um pouco de nós</p>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-2xl"><Foto src={fotos.foto(i)} sizes="180px" /></div>)}
          </div>
          <Etiquetas site={site} />
        </div>
      </section>
    </div>
  );
}
