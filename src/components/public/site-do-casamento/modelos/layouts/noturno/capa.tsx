// Noturno, capa: a foto escura de fundo, o título fino à esquerda, o botão de vidro e a indicação de rolagem.
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { CabecalhoDoModelo, Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";

export function CapaNoturna({ site, linkProps, preview, foto }: Pick<PropriedadesDoLayout, "site" | "linkProps" | "preview"> & { foto: string | null }) {
  return (
    <section id="inicio" className="relative isolate flex min-h-[92vh] flex-col overflow-hidden text-tinta">
      <div className="absolute inset-0 -z-10"><Foto src={foto} alt={`Foto de ${site.coupleNames}`} sizes="100vw" priority className="hero-settle" /></div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0F0C0A]/90 via-[#0F0C0A]/45 to-[#0F0C0A]/10" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-[#0F0C0A] to-transparent" aria-hidden="true" />
      <CabecalhoDoModelo
        marca={<span className="font-display text-xl tracking-[0.18em] uppercase">{site.initials}</span>}
        links={site.navLinks}
        classeDosLinks="text-[11px] uppercase tracking-[0.24em] text-tinta-suave hover:text-tinta"
        classeDoPainel="bg-[#0F0C0A]/95"
        className="relative"
        preview={preview}
      />
      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center gap-6 px-4 pb-24 pt-10 md:px-8">
        <p className="m-0 flex items-center gap-4 text-[11px] uppercase tracking-[0.28em] text-tinta-suave"><span className="block h-px w-12 bg-ameixa" aria-hidden="true" />{site.whenWhere}</p>
        <h1 className="m-0 max-w-[12ch] font-display text-[clamp(52px,8vw,112px)] font-light leading-[1.02] tracking-[-0.015em] text-balance">{site.coupleNames}</h1>
        <p className="m-0 max-w-[40ch] leading-7 text-tinta-suave">{site.s.subtitle?.trim() || "Venham celebrar com a gente uma noite que vamos lembrar para sempre."}</p>
        {site.showRsvp && <Link href={site.rsvpHref} className="vidro inline-flex min-h-12 w-fit items-center gap-3 !rounded-full px-7 text-[11px] uppercase tracking-[0.24em] text-tinta no-underline hover:bg-white/10" {...linkProps}>Confirmar presença <ArrowUpRight className="size-4" aria-hidden="true" /></Link>}
      </div>
      <a href="#cartoes" className="absolute bottom-8 right-6 hidden items-center gap-4 text-[10px] uppercase tracking-[0.28em] text-tinta-suave no-underline md:flex" aria-label="Descer">Role para ver <span className="vidro grid size-12 place-items-center !rounded-full"><ArrowDown className="size-4" aria-hidden="true" /></span></a>
    </section>
  );
}
