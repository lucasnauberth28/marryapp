// Editorial, capa: barra fina com o monograma, a foto aberta e o nome do casal em letra grande à esquerda.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CabecalhoDoModelo, Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";

export function CapaEditorial({ site, linkProps, preview, foto }: Pick<PropriedadesDoLayout, "site" | "linkProps" | "preview"> & { foto: string | null }) {
  const [primeiro, ...resto] = site.coupleNames.split(/\s+(?:&|\+|e)\s+/i);
  return (
    <div id="inicio">
      <CabecalhoDoModelo
        marca={<span className="text-sm font-semibold tracking-[0.08em] text-ameixa">{site.initials}</span>}
        links={site.navLinks}
        classeDosLinks="text-[11px] font-semibold uppercase tracking-[0.18em] text-ameixa hover:opacity-70"
        classeDoPainel="bg-linho border-b border-linha"
        className="relative bg-linho"
        preview={preview}
      />
      <section className="relative isolate flex min-h-[78vh] items-center overflow-hidden text-[#fff]">
        <div className="absolute inset-0 -z-10"><Foto src={foto} alt={`Foto de ${site.coupleNames}`} sizes="100vw" priority className="hero-settle" /></div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/55 via-black/15 to-transparent" aria-hidden="true" />
        <div className="mx-auto w-full max-w-[1200px] px-4 py-20 md:px-8">
          <p className="m-0 mb-5 text-[11px] font-semibold uppercase tracking-[0.2em]">{site.s.subtitle?.trim() || "Juntos para sempre"}</p>
          <h1 className="m-0 font-display text-[clamp(64px,11vw,148px)] font-normal leading-[0.9] tracking-[-0.02em]">{primeiro}{resto.length > 0 ? <> &amp;<br />{resto.join(" e ")}</> : null}</h1>
          <p className="m-0 mt-6 text-[11px] font-semibold uppercase leading-5 tracking-[0.2em]">{site.dateLabel ?? "Em breve"}<br />{site.locationName}</p>
          {site.showRsvp && <Link href={site.rsvpHref} className="mt-8 inline-flex min-h-12 items-center gap-3 bg-ameixa px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-on-ameixa no-underline hover:bg-ameixa-hover" {...linkProps}>Você está convidado <ArrowRight className="size-4" aria-hidden="true" /></Link>}
        </div>
      </section>
    </div>
  );
}
