// Noturno: história em linhas de vidro, presentes, dicas, convite e o rodapé de uma linha.
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";

const titulo = "m-0 font-display text-[clamp(32px,4.4vw,56px)] font-light leading-[1.08] tracking-[-0.01em] text-tinta";

export function Historia({ historia }: Pick<PropriedadesDoLayout, "historia">) {
  if (historia.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-20 md:px-8 md:pb-28">
      <h2 className={`${titulo} mb-8`}>Como chegamos até aqui</h2>
      <ol className="m-0 grid list-none gap-4 p-0">
        {historia.map((m) => <li key={m.id} className="vidro grid gap-2 p-5 md:grid-cols-[200px_1fr] md:gap-8"><p className="m-0 text-[11px] uppercase tracking-[0.24em] text-ameixa">{m.dateLabel}</p><div><p className="m-0 font-display text-2xl font-light text-tinta">{m.title}</p><p className="m-0 mt-1 text-sm leading-6 text-tinta-suave">{m.description}</p></div></li>)}
      </ol>
    </section>
  );
}

export function PresentesDeVidro({ site, presentes, linkProps }: Pick<PropriedadesDoLayout, "site" | "presentes" | "linkProps">) {
  return (
    <section id="presentes" className="mx-auto max-w-[1200px] px-4 pb-20 md:px-8 md:pb-28">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><h2 className={titulo}>Um carinho para a vida nova</h2><Link href={site.giftsHref} className="vidro inline-flex min-h-11 items-center gap-2 !rounded-full px-6 text-[11px] uppercase tracking-[0.24em] text-tinta no-underline" {...linkProps}>Ver todos <ArrowUpRight className="size-4" aria-hidden="true" /></Link></div>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-5 p-0">
        {presentes.slice(0, 4).map((p) => <li key={p.id}><Link href={`/checkout/${p.id}`} className="vidro flex flex-col gap-3 p-3 text-tinta no-underline" {...linkProps}><span className="relative block aspect-[4/3] overflow-hidden rounded-xl"><Foto src={p.imageUrl} sizes="260px" /></span><span className="px-1 pb-2"><strong className="block font-display text-xl font-light leading-6">{p.title}</strong><span className="text-sm text-tinta-suave tabular-nums">{formatarReais(p.amount)}</span></span></Link></li>)}
      </ul>
    </section>
  );
}

export function DicasDeVidro({ dicas }: Pick<PropriedadesDoLayout, "dicas">) {
  return (
    <section id="dicas" className="mx-auto max-w-[1200px] px-4 pb-20 md:px-8 md:pb-28">
      <h2 className={`${titulo} mb-8`}>Dicas aos convidados</h2>
      <div className="grid gap-5 md:grid-cols-3">
        {dicas.map((d) => <article key={d.id} className="vidro flex flex-col gap-2 p-6"><h3 className="m-0 font-display text-2xl font-light text-tinta">{d.title}</h3>{d.description && <p className="m-0 whitespace-pre-line text-sm leading-6 text-tinta-suave">{d.description}</p>}{d.address && <p className="m-0 text-sm text-tinta-suave">{d.address}</p>}{d.discountCode && <p className="m-0 text-[11px] uppercase tracking-[0.24em] text-ameixa">Cupom {d.discountCode}</p>}{d.linkUrl && <a href={d.linkUrl} target="_blank" rel="noopener noreferrer" className="w-fit border-b border-ameixa pb-0.5 text-[11px] uppercase tracking-[0.24em] text-tinta no-underline">Abrir o site</a>}</article>)}
      </div>
    </section>
  );
}

export function ConviteNoturno({ site, linkProps }: Pick<PropriedadesDoLayout, "site" | "linkProps">) {
  return (
    <section id="confirmar" className="mx-auto max-w-[1200px] px-4 pb-20 md:px-8 md:pb-28">
      <div className="vidro flex flex-col items-center gap-5 px-6 py-16 text-center"><h2 className={titulo}>Contamos com você</h2><p className="m-0 max-w-[40ch] leading-7 text-tinta-suave">{site.deadlineLabel ? `Responda até ${site.deadlineLabel}. ` : ""}Leva menos de um minuto: é só informar o seu WhatsApp.</p><Link href={site.rsvpHref} className="inline-flex min-h-12 items-center rounded-full bg-ameixa px-8 text-[11px] uppercase tracking-[0.24em] text-on-ameixa no-underline" {...linkProps}>Confirmar presença</Link></div>
    </section>
  );
}

export function RodapeNoturno({ site }: Pick<PropriedadesDoLayout, "site">) {
  return <footer className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 border-t border-linha px-4 py-8 text-[10px] uppercase tracking-[0.24em] text-tinta-suave md:px-8"><span>© {site.coupleNames}</span><span>{site.dateLabel ? `${site.dateLabel} · ` : ""}Feito com Aceito</span></footer>;
}
