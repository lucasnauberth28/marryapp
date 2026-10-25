// Editorial: a história em três colunas (texto, foto com legenda, duas fotos soltas) e o fim de semana em tabela de fios.
import { Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";

type Fotos = { foto: (i: number) => string | null };
const rotulo = "m-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-ameixa";
export const titulo = "m-0 font-display text-[clamp(44px,6vw,84px)] font-normal leading-[0.95] tracking-[-0.02em] text-tinta";

export function NossaHistoria({ site, historia, fotos }: Pick<PropriedadesDoLayout, "site" | "historia"> & { fotos: Fotos }) {
  return (
    <section id="historia" className="mx-auto grid max-w-[1200px] gap-10 px-4 py-20 md:grid-cols-[1fr_1.1fr_0.9fr] md:gap-12 md:px-8 md:py-32">
      <div className="flex flex-col gap-6 md:pt-12">
        <span className="block h-px w-16 bg-ameixa" aria-hidden="true" />
        <h2 className={titulo}>Nossa<br />história</h2>
        <div className="flex max-w-[34ch] flex-col gap-3 text-[15px] leading-6 text-tinta-suave">
          <p className="m-0 whitespace-pre-line">{site.s.welcomeMessage?.trim() || `${site.coupleNames} vão se casar e querem ter você por perto.`}</p>
          {historia.slice(0, 3).map((m) => <p key={m.id} className="m-0"><b className="font-semibold text-tinta">{m.title}.</b> {m.description}</p>)}
        </div>
      </div>
      <figure className="m-0 flex flex-col gap-3">
        <div className="relative aspect-[3/4] overflow-hidden"><Foto src={fotos.foto(1)} sizes="(min-width: 768px) 420px, 90vw" /></div>
        <figcaption className={rotulo}>{site.s.subtitle?.trim() || "Lugares diferentes. Nós, os mesmos."}</figcaption>
      </figure>
      <div className="flex flex-col gap-6 md:pt-6">
        <p className={rotulo}>Lugares e momentos favoritos</p>
        <div className="relative aspect-[4/3] overflow-hidden"><Foto src={fotos.foto(2)} sizes="320px" /></div>
        <div className="relative ml-auto aspect-[3/4] w-[70%] overflow-hidden"><Foto src={fotos.foto(3)} sizes="240px" /></div>
      </div>
    </section>
  );
}

/** O fim de semana: um título enorme à esquerda e a programação em linhas finas à direita. */
export function FimDeSemana({ site }: Pick<PropriedadesDoLayout, "site">) {
  return (
    <section id="cerimonia" className="mx-auto grid max-w-[1200px] gap-10 px-4 pb-20 md:grid-cols-[1fr_1.2fr] md:gap-16 md:px-8 md:pb-32">
      <div className="flex flex-col gap-6"><h2 className={titulo}>O dia<br />do sim</h2>
        {(site.s.dressCodeTitle || site.address) && <p className="m-0 max-w-[36ch] text-[15px] leading-6 text-tinta-suave">{[site.s.dressCodeTitle && `Traje: ${site.s.dressCodeTitle}.`, site.s.dressCodeDesc, site.address].filter(Boolean).join(" ")}</p>}
        {site.mapsUrl && <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className={`${rotulo} w-fit border-b border-ameixa pb-1 no-underline`}>Como chegar</a>}
      </div>
      <ol className="m-0 flex list-none flex-col p-0">
        {site.program.map((m, i) => (
          <li key={`${m.title}-${i}`} className="grid grid-cols-[1fr_auto] gap-x-6 border-t border-tinta py-5 last:border-b">
            <div><p className="m-0 font-display text-2xl text-tinta md:text-3xl">{m.title}</p><p className="m-0 mt-1 text-sm text-tinta-suave">{[m.day, m.place].filter(Boolean).join(" · ")}</p></div>
            <p className={`${rotulo} self-center`}>{m.time}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
