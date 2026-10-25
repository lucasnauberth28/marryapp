// Campo: boas-vindas com as fotos escalonadas, a programação em calendários verdes e o traje com as cores.
import { Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";

type Fotos = { foto: (i: number) => string | null };
export const tituloManuscrito = "m-0 font-[family-name:var(--font-modelo-great-vibes)] text-[clamp(48px,7vw,88px)] font-normal leading-[1] text-ameixa";

export function BoasVindas({ site, fotos }: Pick<PropriedadesDoLayout, "site"> & { fotos: Fotos }) {
  return (
    <section id="historia" className="mx-auto max-w-[1200px] px-4 py-20 md:px-8 md:py-28">
      <div className="grid gap-6 md:grid-cols-[1fr_1.3fr] md:items-end md:gap-16"><h2 className={tituloManuscrito}>Bem-vindos ao nosso casamento</h2><p className="m-0 max-w-[60ch] whitespace-pre-line leading-8 tracking-[0.02em] text-tinta-suave">{site.s.welcomeMessage?.trim() || "Será uma alegria ter você com a gente nesse dia."}</p></div>
      <div className="mt-14 grid grid-cols-3 items-start gap-3 md:gap-8">
        {[[1, "aspect-[3/4]", "mt-0"], [2, "aspect-[3/4]", "mt-10 md:mt-20"], [3, "aspect-[3/4]", "mt-4 md:mt-8"]].map(([i, forma, desloca]) => (
          <div key={String(i)} className={`relative overflow-hidden ${forma} ${desloca}`}><Foto src={fotos.foto(Number(i))} sizes="(min-width: 768px) 360px, 33vw" /></div>
        ))}
      </div>
    </section>
  );
}

/** Cada momento ganha um quadradinho de calendário verde, com o dia do mês, e o texto ao lado. */
export function OrdemDoDia({ site }: Pick<PropriedadesDoLayout, "site">) {
  if (site.program.length === 0) return null;
  return (
    <section id="cerimonia" className="bg-areia">
      <div className="mx-auto max-w-[900px] px-4 py-20 md:px-8 md:py-28">
        <h2 className={`${tituloManuscrito} mb-12 text-center`}>Ordem do dia</h2>
        <ol className="m-0 flex list-none flex-col gap-6 p-0">
          {site.program.map((m, i) => (
            <li key={`${m.title}-${i}`} className="grid grid-cols-[84px_1fr] items-center gap-5">
              <div className="flex aspect-square flex-col items-center justify-center bg-ameixa text-on-ameixa"><span className="text-[10px] font-semibold uppercase tracking-[0.2em]">{m.day.split(",")[0].slice(0, 3) || "Dia"}</span><span className="font-display text-3xl leading-none">{m.time || "—"}</span></div>
              <div><p className="m-0 font-display text-2xl text-tinta">{m.title}</p><p className="m-0 mt-1 text-sm leading-6 text-tinta-suave">{[m.day, m.place].filter(Boolean).join(" · ")}</p></div>
            </li>
          ))}
        </ol>
        {site.showDress && <div className="mt-14 flex flex-col items-center gap-4 text-center"><p className="m-0 font-display text-2xl text-tinta">Traje: {site.s.dressCodeTitle}</p>{site.s.dressCodeDesc && <p className="m-0 max-w-[48ch] text-sm leading-6 text-tinta-suave">{site.s.dressCodeDesc}</p>}{site.palette.length > 0 && <ul aria-label="Cores sugeridas" className="m-0 flex list-none gap-3 p-0">{site.palette.map((c) => <li key={c} className="size-9 rounded-full ring-2 ring-papel" style={{ backgroundColor: c }} title={c} />)}</ul>}</div>}
      </div>
    </section>
  );
}
