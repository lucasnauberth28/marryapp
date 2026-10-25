// Noturno: os três cartões altos de vidro com foto (os momentos do dia) e a fileira de cartões menores logo abaixo.
import { ArrowUpRight, Globe, Quote } from "lucide-react";
import { Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";

type Fotos = { foto: (i: number) => string | null };

export function TresMomentos({ site, fotos }: Pick<PropriedadesDoLayout, "site"> & { fotos: Fotos }) {
  const itens = site.program.slice(0, 3);
  if (itens.length === 0) return null;
  return (
    <section id="cartoes" className="mx-auto max-w-[1200px] px-4 pb-5 md:px-8">
      <ol className="m-0 grid list-none gap-5 p-0 md:grid-cols-3">
        {itens.map((m, i) => (
          <li key={`${m.title}-${i}`} className="vidro relative flex min-h-[420px] flex-col justify-between overflow-hidden p-5">
            <div className="absolute inset-0 -z-0 opacity-70"><Foto src={fotos.foto(i + 1)} sizes="(min-width: 768px) 380px, 90vw" /></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0C0A] via-[#0F0C0A]/40 to-[#0F0C0A]/10" aria-hidden="true" />
            <div className="relative flex items-center justify-between text-xs tracking-[0.2em] text-tinta-suave"><span>{String(i + 1).padStart(2, "0")}</span><ArrowUpRight className="size-4" aria-hidden="true" /></div>
            <div className="relative"><h3 className="m-0 font-display text-3xl font-light leading-9 text-tinta">{m.title}</h3><p className="m-0 mt-2 text-sm leading-6 text-tinta-suave">{[m.day, m.time].filter(Boolean).join(" · ")}<br />{m.place}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function FileiraDeCartoes({ site, recados, fotos }: Pick<PropriedadesDoLayout, "site" | "recados"> & { fotos: Fotos }) {
  const frase = recados[0]?.message ?? site.s.welcomeMessage?.trim() ?? "Será uma noite para guardar.";
  const autor = recados[0]?.authorName ?? site.coupleNames;
  return (
    <section id="historia" className="mx-auto grid max-w-[1200px] gap-5 px-4 pb-20 md:grid-cols-[1.3fr_1fr_1fr] md:px-8 md:pb-28">
      <figure className="vidro m-0 flex flex-col justify-between gap-6 p-6"><Quote className="size-8 text-ameixa" aria-hidden="true" /><blockquote className="m-0 whitespace-pre-line font-display text-2xl font-light leading-8 text-tinta">{frase}</blockquote><figcaption className="text-[11px] uppercase tracking-[0.24em] text-tinta-suave">— {autor}</figcaption></figure>
      <div className="vidro flex flex-col items-center justify-center gap-4 p-6 text-center"><Globe className="size-8 text-ameixa" strokeWidth={1.2} aria-hidden="true" /><p className="m-0 text-[11px] uppercase leading-5 tracking-[0.24em] text-tinta-suave">{site.locationName || "O local"}<br />{site.address}</p>{site.mapsUrl && <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="border-b border-ameixa pb-0.5 text-[11px] uppercase tracking-[0.24em] text-tinta no-underline">Como chegar</a>}</div>
      <div className="vidro flex flex-col justify-between gap-4 p-5"><p className="m-0 text-[11px] uppercase tracking-[0.24em] text-tinta-suave">Momentos de vocês e de nós</p><div className="grid grid-cols-3 gap-2">{[4, 5, 6].map((i) => <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-lg"><Foto src={fotos.foto(i)} sizes="120px" /></div>)}</div></div>
    </section>
  );
}
