// Campo, capa: a paisagem de fundo, o nome do casal em letra manuscrita, o dia em numeral grande e a contagem em blocos verdes.
import { ContagemRegressivaDoCasamento } from "@/components/public/wedding-site-countdown";
import { CabecalhoDoModelo, Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";
import { QrDaPagina } from "./qr";

export function CapaDoCampo({ site, linkProps, preview, foto }: Pick<PropriedadesDoLayout, "site" | "linkProps" | "preview"> & { foto: string | null }) {
  const dia = site.weekdayLabel?.split(",")[0] ?? null;
  const numero = site.dateLabel?.split(" ")[0] ?? null;
  const mes = site.dateLabel?.split(" de ")[1] ?? null;
  return (
    <section id="inicio" className="relative isolate flex min-h-[88vh] flex-col overflow-hidden text-[#fff]">
      <div className="absolute inset-0 -z-10"><Foto src={foto} alt={`Foto de ${site.coupleNames}`} sizes="100vw" priority className="hero-settle" /></div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/10 to-black/55" aria-hidden="true" />
      <CabecalhoDoModelo
        marca={<span className="font-display text-lg uppercase tracking-[0.3em]">{site.coupleNames.replace(/\s*&\s*/, " ✿ ")}</span>}
        links={site.navLinks}
        classeDosLinks="text-xs font-semibold uppercase tracking-[0.2em] text-[#fff] hover:opacity-70"
        classeDoPainel="bg-[#2B3727]"
        className="absolute inset-x-0 top-0 text-[#fff]"
        preview={preview}
      />
      <div className="mx-auto grid w-full max-w-[1200px] flex-1 content-center gap-6 px-4 pb-10 pt-28 md:px-8">
        <h1 className="m-0 font-[family-name:var(--font-modelo-great-vibes)] text-[clamp(64px,13vw,168px)] font-normal leading-[0.9] [text-shadow:0_2px_30px_rgb(0_0_0/0.35)]">{site.coupleNames}</h1>
        {dia && numero && <p className="m-0 flex items-end gap-4 font-[family-name:var(--font-modelo-great-vibes)] md:justify-end"><span className="text-4xl capitalize md:text-6xl">{dia}</span><span className="font-num text-[clamp(64px,9vw,128px)] font-light leading-[0.8]">{numero}</span><span className="pb-2 text-2xl capitalize md:text-4xl">{mes}</span></p>}
      </div>
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-end justify-between gap-6 px-4 pb-10 md:px-8">
        {site.countdownTarget !== null && <div className="contagem-campo"><ContagemRegressivaDoCasamento target={site.countdownTarget} /></div>}
        {site.showRsvp && <QrDaPagina href={site.rsvpHref} rotulo="Confirme aqui" linkProps={linkProps} />}
      </div>
    </section>
  );
}
