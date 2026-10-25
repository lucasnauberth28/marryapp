// Floral rosé: boas-vindas com a contagem em pastilhas, "o que esperar" em quatro colunas, a história e o convite.
import Link from "next/link";
import { Camera, Gift, Heart, Music, UtensilsCrossed, Wine, type LucideIcon } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { ContagemRegressivaDoCasamento } from "@/components/public/wedding-site-countdown";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";
import { Ramo } from "./ornamentos";

type Fotos = { foto: (i: number) => string | null };
const titulo = "m-0 font-display text-[clamp(32px,4.4vw,52px)] font-semibold leading-[1.08] tracking-[-0.01em] text-tinta";
const ICONES: LucideIcon[] = [Heart, Wine, UtensilsCrossed, Music, Camera, Gift];

export function BoasVindas({ site, fotos }: Pick<PropriedadesDoLayout, "site"> & { fotos: Fotos }) {
  return (
    <section id="historia" className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 md:grid-cols-[1fr_1fr] md:gap-16 md:px-8 md:py-24">
      <div className="relative mx-auto w-full max-w-[420px]">
        <Ramo className="absolute -right-10 -top-10 z-10 h-[240px] -scale-x-100 text-ameixa/75" />
        <div className="relative aspect-[4/5] overflow-hidden bg-areia" style={{ borderRadius: "28px 160px 28px 28px" }}><Foto src={fotos.foto(1)} sizes="420px" /></div>
      </div>
      <div className="flex flex-col gap-5">
        <h2 className={titulo}>Bem-vindos ao nosso casamento</h2>
        <p className="m-0 max-w-[48ch] whitespace-pre-line leading-7 text-tinta-suave">{site.s.welcomeMessage?.trim() || "Será uma alegria ter você com a gente nesse dia."}</p>
        {site.countdownTarget !== null && <div><ContagemRegressivaDoCasamento target={site.countdownTarget} /></div>}
      </div>
    </section>
  );
}

export function OQueEsperar({ site }: Pick<PropriedadesDoLayout, "site">) {
  const itens = site.program.slice(0, 4);
  if (itens.length === 0) return null;
  return (
    <section id="cerimonia" className="mx-auto max-w-[1200px] px-4 pb-16 md:px-8 md:pb-24">
      <h2 className={`${titulo} mb-10 text-center`}>O que esperar do dia</h2>
      <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {itens.map((m, i) => {
          const Icone = ICONES[i % ICONES.length];
          const destaque = i === 1 || itens.length === 1;
          return (
            <li key={`${m.title}-${i}`} className={`flex flex-col items-center gap-3 rounded-[32px] px-6 py-9 text-center ${destaque ? "bg-ameixa text-on-ameixa shadow-[var(--shadow-aceito-2)]" : "text-tinta"}`}>
              <Icone className="size-9" strokeWidth={1.4} aria-hidden="true" />
              <h3 className="m-0 font-display text-2xl font-semibold leading-7">{m.title}</h3>
              <p className={`m-0 text-sm leading-6 ${destaque ? "opacity-90" : "text-tinta-suave"}`}>{[m.day, m.time].filter(Boolean).join(" · ")}<br />{m.place}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function NossaHistoria({ historia, fotos }: Pick<PropriedadesDoLayout, "historia"> & { fotos: Fotos }) {
  if (historia.length === 0) return null;
  return (
    <section className="bg-areia">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 md:grid-cols-[1.1fr_1fr] md:gap-16 md:px-8 md:py-24">
        <div className="flex flex-col gap-6"><h2 className={titulo}>A nossa história</h2>
          <ol className="m-0 flex list-none flex-col gap-5 p-0">{historia.map((m) => <li key={m.id} className="flex gap-4"><span className="mt-2 size-3 shrink-0 rounded-full bg-ameixa" aria-hidden="true" /><div><p className="m-0 font-display text-xl font-semibold text-tinta">{m.title}{m.dateLabel ? <span className="font-normal text-tinta-suave"> · {m.dateLabel}</span> : null}</p><p className="m-0 mt-1 text-sm leading-6 text-tinta-suave">{m.description}</p></div></li>)}</ol>
        </div>
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[400px] overflow-hidden bg-papel" style={{ borderRadius: "160px 28px 28px 28px" }}><Foto src={fotos.foto(2)} sizes="400px" /></div>
      </div>
    </section>
  );
}

export function PresentesFloral({ site, presentes, linkProps }: Pick<PropriedadesDoLayout, "site" | "presentes" | "linkProps">) {
  return (
    <section id="presentes" className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4"><h2 className={titulo}>Um carinho para a vida nova</h2><Link href={site.giftsHref} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`} {...linkProps}>Ver todos</Link></div>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-5 p-0">
        {presentes.slice(0, 4).map((p) => <li key={p.id}><Link href={`/checkout/${p.id}`} className="flex flex-col gap-3 rounded-[28px] bg-papel p-3 pb-5 text-tinta no-underline shadow-[var(--shadow-aceito-1)]" {...linkProps}><span className="relative block aspect-square overflow-hidden rounded-[22px]"><Foto src={p.imageUrl} sizes="260px" /></span><span className="px-2"><strong className="block font-display text-xl font-semibold leading-6">{p.title}</strong><span className="text-sm text-tinta-suave tabular-nums">{formatarReais(p.amount)}</span></span></Link></li>)}
      </ul>
    </section>
  );
}
