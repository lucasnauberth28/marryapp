// Papel rasgado: as folhas de papel que cobrem a foto, a lista de momentos e o convite à mesa.
import Link from "next/link";
import { estiloDoBotao } from "@/components/landing/styles";
import { Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";

export const tituloDaFolha = "m-0 font-display text-[clamp(30px,5vw,56px)] font-normal uppercase leading-[1.05] tracking-[0.01em] text-tinta";
export const botaoEscuro = `${estiloDoBotao.primary} !rounded-full !bg-ameixa !text-on-ameixa`;

type Fotos = { foto: (i: number) => string | null };

/** "Nossa história": texto e duas fotos de um lado, uma foto alta do outro. */
export function FolhaDaHistoria({ site, linkProps, fotos }: Pick<PropriedadesDoLayout, "site" | "linkProps"> & { fotos: Fotos }) {
  return (
    <section id="historia" className="papel-folha bg-papel">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-16 md:grid-cols-[1.15fr_1fr] md:gap-10 md:px-8 md:py-24">
        <div className="flex flex-col gap-6">
          <h2 className={tituloDaFolha}>Nossa história</h2>
          <p className="m-0 max-w-[52ch] whitespace-pre-line text-[15px] leading-6 text-tinta md:text-base">{site.s.welcomeMessage?.trim() || `${site.coupleNames} vão se casar e querem ter você por perto nesse dia.`}</p>
          <div className="relative aspect-[16/9] overflow-hidden"><Foto src={fotos.foto(1)} sizes="(min-width: 768px) 560px, 90vw" /></div>
          {site.showRsvp && <Link href={site.rsvpHref} className={`${botaoEscuro} ${estiloDoBotao.block}`} {...linkProps}>Confirmar presença</Link>}
        </div>
        <div className="relative min-h-[420px] overflow-hidden md:min-h-full"><Foto src={fotos.foto(2)} sizes="(min-width: 768px) 480px, 90vw" /></div>
      </div>
    </section>
  );
}

/** Os momentos marcantes como lista de títulos com fios, ao lado de duas fotos. */
export function FolhaDosMomentos({ historia, fotos }: Pick<PropriedadesDoLayout, "historia"> & { fotos: Fotos }) {
  if (historia.length === 0) return null;
  return (
    <section id="momentos" className="papel-folha bg-papel">
      <div className="mx-auto max-w-[1200px] px-4 pb-16 md:px-8 md:pb-24">
        <h2 className={`${tituloDaFolha} mb-8`}>Nossos momentos</h2>
        <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:gap-12">
          <div className="grid grid-cols-[1.2fr_1fr] items-end gap-3">
            <div className="relative aspect-[3/4] overflow-hidden"><Foto src={fotos.foto(3)} sizes="260px" /></div>
            <div className="relative aspect-square overflow-hidden"><Foto src={fotos.foto(4)} sizes="200px" /></div>
          </div>
          <ol className="m-0 flex list-none flex-col p-0">
            {historia.map((m) => (
              <li key={m.id} className="border-b border-tinta py-4 first:pt-0">
                <p className="m-0 font-display text-xl uppercase leading-7 text-tinta">{m.dateLabel ? `${m.dateLabel} · ` : ""}{m.title}</p>
                <p className="m-0 mt-1 whitespace-pre-line text-sm leading-5 text-tinta-suave">{m.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** A programação sobre a foto de fundo, em cartões brancos arredondados. */
export function BandaDaProgramacao({ site, fotos }: Pick<PropriedadesDoLayout, "site"> & { fotos: Fotos }) {
  if (site.program.length === 0) return null;
  return (
    <section id="cerimonia" className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10"><Foto src={fotos.foto(5)} sizes="100vw" /></div>
      <div className="absolute inset-0 -z-10 bg-ameixa/25" aria-hidden="true" />
      <div className="mx-auto flex max-w-[640px] flex-col gap-3 px-4 py-24 md:py-32">
        <h2 className={`${tituloDaFolha} mb-4 text-center !text-[#fff]`}>Programação</h2>
        {site.program.map((m, i) => (
          <article key={`${m.title}-${i}`} className="rounded-xl bg-[#fff]/92 px-6 py-5 text-center text-[#2A2F32]">
            <h3 className="m-0 font-display text-2xl leading-8">{i + 1}. {m.title}</h3>
            <p className="m-0 text-sm leading-6 opacity-80">{[m.day, m.time, m.place].filter(Boolean).join(" · ")}</p>
          </article>
        ))}
        {site.s.dressCodeTitle && <p className="m-0 mt-2 text-center text-sm text-[#fff] [text-shadow:0_1px_12px_rgb(0_0_0/0.4)]">Traje: {site.s.dressCodeTitle}</p>}
      </div>
    </section>
  );
}
