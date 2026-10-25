// Monocromático, capa: foto de página inteira, nomes em Bodoni de caixa alta no canto inferior e a seta que convida a descer.
import { ArrowDown } from "lucide-react";
import { CabecalhoDoModelo, Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";

export function CapaMonocromo({ site, preview, foto }: Pick<PropriedadesDoLayout, "site" | "preview"> & { foto: string | null }) {
  const [primeiro, ...resto] = site.coupleNames.split(/\s+(?:&|\+|e)\s+/i);
  return (
    <section id="inicio" className="relative isolate flex min-h-[92vh] flex-col justify-end overflow-hidden text-[#fff]">
      <div className="absolute inset-0 -z-10"><Foto src={foto} alt={`Foto de ${site.coupleNames}`} sizes="100vw" priority className="hero-settle" /></div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/10 to-black/25" aria-hidden="true" />
      <CabecalhoDoModelo
        marca={<span className="text-sm tracking-[0.3em]">{site.initials.replace("&", " | ")}</span>}
        links={site.navLinks}
        classeDosLinks="text-[11px] uppercase tracking-[0.24em] text-[#fff] hover:opacity-70"
        classeDoPainel="bg-[#111]"
        className="absolute inset-x-0 top-0 text-[#fff]"
        preview={preview}
      />
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-14 md:px-8 md:pb-20">
        <p className="m-0 mb-6 text-[11px] uppercase tracking-[0.3em]">{site.s.subtitle?.trim() || "Com a bênção de nossas famílias"}</p>
        <h1 className="m-0 font-display text-[clamp(56px,10vw,132px)] font-normal uppercase leading-[0.95] tracking-[-0.01em]">
          {primeiro}
          {resto.length > 0 && <><br /><span className="my-1 block text-[0.42em] font-normal normal-case italic leading-none tracking-normal">e</span>{resto.join(" e ")}</>}
        </h1>
        <span className="my-6 block h-px w-14 bg-[#fff]" aria-hidden="true" />
        <p className="m-0 text-[11px] uppercase leading-6 tracking-[0.3em]">{site.dateLabel ?? "Em breve"}<br />{site.locationName}</p>
        <a href="#historia" aria-label="Descer" className="mt-8 inline-block text-[#fff]"><ArrowDown className="size-5" aria-hidden="true" /></a>
      </div>
    </section>
  );
}
