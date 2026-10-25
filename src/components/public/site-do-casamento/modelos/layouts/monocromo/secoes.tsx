// Monocromático: a mensagem de boas-vindas ao lado da foto, a faixa preta com a linha do tempo e o convite em duas metades.
import Link from "next/link";
import { Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";

type Fotos = { foto: (i: number) => string | null };
const rotulo = "m-0 text-[11px] uppercase tracking-[0.3em] text-tinta-suave";
export const titulo = "m-0 font-display text-[clamp(34px,4.6vw,60px)] font-normal leading-[1.08] tracking-[-0.01em] text-tinta";

export function BoasVindas({ site, fotos }: Pick<PropriedadesDoLayout, "site"> & { fotos: Fotos }) {
  return (
    <section id="historia" className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-20 md:grid-cols-[0.9fr_1fr] md:gap-20 md:px-8 md:py-32">
      <div className="relative aspect-[4/5] overflow-hidden"><Foto src={fotos.foto(1)} sizes="(min-width: 768px) 480px, 90vw" /></div>
      <div className="flex flex-col gap-6">
        <p className={rotulo}>Bem-vindos</p>
        <h2 className={titulo}>Mal podemos esperar para celebrar com você.</h2>
        <span className="block h-px w-14 bg-tinta" aria-hidden="true" />
        <p className="m-0 max-w-[44ch] whitespace-pre-line leading-7 text-tinta-suave">{site.s.welcomeMessage?.trim() || "Venha viver conosco um fim de semana de risadas, boa comida e muito amor."}</p>
        <p className="m-0 font-[family-name:var(--font-modelo-great-vibes)] text-4xl text-tinta">{site.coupleNames.replace(/\s*&\s*/, " + ")}</p>
      </div>
    </section>
  );
}

/** A faixa preta: os momentos numerados, ligados por uma linha, lado a lado no computador. */
export function LinhaDoTempo({ site }: Pick<PropriedadesDoLayout, "site">) {
  if (site.program.length === 0) return null;
  return (
    <section id="cerimonia" className="bg-tinta text-linho">
      <div className="mx-auto max-w-[1200px] px-4 py-20 md:px-8 md:py-28">
        <p className="m-0 text-center text-[11px] uppercase tracking-[0.3em] opacity-70">Programação</p>
        <h2 className="m-0 mb-14 mt-3 text-center font-display text-[clamp(34px,4.6vw,60px)] font-normal">A celebração</h2>
        <ol className="m-0 grid list-none gap-10 p-0 md:auto-cols-fr md:grid-flow-col md:gap-4">
          {site.program.map((m, i) => (
            <li key={`${m.title}-${i}`} className="relative flex flex-col items-start gap-3 border-l border-linho/30 pl-6 md:items-center md:border-l-0 md:border-t md:border-linho/30 md:pl-0 md:pt-8 md:text-center">
              <span className="absolute -left-[5px] top-1 size-[9px] rounded-full bg-linho md:-top-[5px] md:left-1/2 md:-translate-x-1/2" aria-hidden="true" />
              <span className="text-[11px] tracking-[0.3em] opacity-60">{String(i + 1).padStart(2, "0")}</span>
              <p className="m-0 text-[11px] font-semibold uppercase leading-5 tracking-[0.24em]">{m.title}</p>
              <p className="m-0 text-sm leading-6 opacity-75">{[m.day, m.time].filter(Boolean).join("\n")}<br />{m.place}</p>
            </li>
          ))}
        </ol>
        {site.mapsUrl && <p className="m-0 mt-14 text-center"><a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="border-b border-linho pb-1 text-[11px] uppercase tracking-[0.3em] text-linho no-underline">Ver como chegar →</a></p>}
      </div>
    </section>
  );
}

export function ConviteEmDuasMetades({ site, linkProps, foto }: Pick<PropriedadesDoLayout, "site" | "linkProps"> & { foto: string | null }) {
  return (
    <section id="confirmar" className="grid md:grid-cols-2">
      <div className="relative min-h-[360px] overflow-hidden"><Foto src={foto} sizes="50vw" className="grayscale" /></div>
      <div className="flex flex-col justify-center gap-6 px-6 py-16 md:px-20">
        <p className={rotulo}>Confirmação</p>
        <h2 className={titulo}>Responda ao convite</h2>
        <span className="block h-px w-14 bg-tinta" aria-hidden="true" />
        <p className="m-0 max-w-[36ch] leading-7 text-tinta-suave">{site.deadlineLabel ? `Pedimos que responda até ${site.deadlineLabel}. ` : ""}Informe o seu WhatsApp para encontrar o seu convite.</p>
        <Link href={site.rsvpHref} className="inline-flex min-h-12 w-fit items-center bg-tinta px-8 text-[11px] uppercase tracking-[0.3em] text-linho no-underline hover:opacity-85" {...linkProps}>Enviar resposta</Link>
      </div>
    </section>
  );
}
