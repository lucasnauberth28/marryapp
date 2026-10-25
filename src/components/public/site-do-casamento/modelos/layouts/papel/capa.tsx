// Papel rasgado, capa: a foto inteira com o nome do casal como logotipo gigante, como nas capas de revista de agência.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Foto, CabecalhoDoModelo } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";

export function CapaDoPapel({ site, linkProps, preview, foto }: Pick<PropriedadesDoLayout, "site" | "linkProps" | "preview"> & { foto: string | null }) {
  return (
    <section id="inicio" className="relative isolate min-h-[84vh] overflow-hidden text-[#fff]">
      <div className="absolute inset-0 -z-10"><Foto src={foto} alt={`Foto de ${site.coupleNames}`} sizes="100vw" priority className="hero-settle" /></div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/5 to-black/35" aria-hidden="true" />
      <CabecalhoDoModelo
        marca={<span className="text-xs font-semibold uppercase tracking-[0.18em]">{site.initials}</span>}
        links={site.navLinks}
        classeDosLinks="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fff] hover:opacity-70"
        classeDoPainel="bg-[#2A2F32]"
        className="absolute inset-x-0 top-0 text-[#fff]"
        preview={preview}
      />
      <div className="mx-auto flex min-h-[84vh] max-w-[1200px] flex-col items-center justify-center gap-4 px-4 pb-28 pt-24 text-center">
        <h1 className="m-0 font-display text-[clamp(56px,13vw,176px)] font-normal uppercase leading-[0.92] tracking-[-0.01em] [text-shadow:0_2px_30px_rgb(0_0_0/0.3)]">{site.coupleNames}</h1>
        <p className="m-0 max-w-[40ch] text-lg tracking-wide opacity-95">{site.s.subtitle?.trim() || site.whenWhere}</p>
        {site.showRsvp && (
          <Link href={site.rsvpHref} className="mt-4 inline-flex items-center gap-2 border-b border-[#fff]/80 pb-1 text-sm font-semibold uppercase tracking-[0.16em] text-[#fff] no-underline hover:opacity-75" {...linkProps}>
            <ArrowRight className="size-4" aria-hidden="true" /> Confirmar presença
          </Link>
        )}
      </div>
    </section>
  );
}
