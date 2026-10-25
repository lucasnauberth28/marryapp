// Floral rosé, capa: o texto à esquerda e a foto num retângulo de cantos de arco, com ramo de flores e as cores do dia.
import Link from "next/link";
import { Play } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { CabecalhoDoModelo, Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";
import { Bolinhas, Ramo } from "./ornamentos";

export function CapaFloral({ site, linkProps, preview, foto }: Pick<PropriedadesDoLayout, "site" | "linkProps" | "preview"> & { foto: string | null }) {
  return (
    <section id="inicio" className="relative">
      <CabecalhoDoModelo
        marca={<span className="font-display text-[26px] font-semibold text-tinta">{site.initials}</span>}
        links={site.navLinks}
        acao={site.showRsvp ? <Link href={site.rsvpHref} className={`${estiloDoBotao.primary} ${estiloDoBotao.sm}`} {...linkProps}>Confirmar presença</Link> : null}
        classeDosLinks="text-sm font-medium text-tinta hover:text-ameixa"
        classeDoPainel="bg-linho shadow-[var(--shadow-aceito-2)]"
        className="relative"
        preview={preview}
      />
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 pb-20 pt-6 md:grid-cols-[1.05fr_1fr] md:gap-8 md:px-8 md:pb-28 md:pt-12">
        <div className="flex flex-col items-start gap-6">
          <h1 className="m-0 font-display text-[clamp(48px,7vw,92px)] font-semibold leading-[1.02] tracking-[-0.015em] text-tinta text-balance">{site.coupleNames}</h1>
          <p className="m-0 max-w-[38ch] text-lg leading-7 text-tinta-suave">{site.s.subtitle?.trim() || site.whenWhere}</p>
          <div className="flex items-center gap-3">
            {site.showRsvp ? <Link href={site.rsvpHref} className={estiloDoBotao.primary} {...linkProps}>Confirmar presença</Link> : null}
            <a href="#cerimonia" aria-label="Ver o dia" className="grid size-12 place-items-center rounded-full border border-linha-forte text-tinta" {...linkProps}><Play className="size-4 fill-current" aria-hidden="true" /></a>
          </div>
          <p className="m-0 text-sm text-tinta-suave">{site.whenWhere}</p>
        </div>
        <div className="relative mx-auto w-full max-w-[460px]">
          <Ramo className="absolute -left-20 bottom-0 z-10 h-[340px] text-ameixa/75 max-md:hidden" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-[200px] rounded-b-[28px] bg-areia" style={{ borderTopLeftRadius: "220px", borderTopRightRadius: "120px" }}><Foto src={foto} alt={`Foto de ${site.coupleNames}`} sizes="460px" priority className="hero-settle" /></div>
          <div className="absolute -right-4 top-1/3 max-md:right-2"><Bolinhas cores={site.palette} /></div>
        </div>
      </div>
    </section>
  );
}
