// Arco bege: a essência do casal, as memórias em linhas, os presentes, as dúvidas, o convite sobre a foto e o rodapé.
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";

type Fotos = { foto: (i: number) => string | null };
const titulo = "m-0 font-display text-[clamp(30px,4vw,48px)] font-medium leading-[1.1] tracking-[-0.015em] text-tinta";

export function Essencia({ site, fotos }: Pick<PropriedadesDoLayout, "site"> & { fotos: Fotos }) {
  return (
    <section id="galeria" className="mx-auto grid max-w-[1200px] items-center gap-8 px-4 pb-20 md:grid-cols-[1.1fr_1fr] md:px-8 md:pb-28">
      <div className="relative grid gap-4 rounded-3xl bg-areia p-6 md:grid-cols-[1fr_1.1fr] md:p-8">
        <div className="flex flex-col justify-center gap-3"><h2 className={titulo}>A essência de {site.initials}</h2><p className="m-0 text-sm leading-6 text-tinta-suave">{site.s.dressCodeDesc?.trim() || "Um dia simples, feito de gente querida, boa comida e música."}</p></div>
        <div className="arch relative aspect-[3/4] overflow-hidden"><Foto src={fotos.foto(3)} sizes="320px" /></div>
      </div>
      <div className="grid gap-3"><div className="relative aspect-[4/3] overflow-hidden rounded-2xl"><Foto src={fotos.foto(4)} sizes="520px" /></div><div className="grid grid-cols-3 gap-3">{[5, 6, 7].map((i) => <div key={i} className="relative aspect-square overflow-hidden rounded-2xl"><Foto src={fotos.foto(i)} sizes="160px" /></div>)}</div></div>
    </section>
  );
}

export function MemoriasEmLinhas({ historia }: Pick<PropriedadesDoLayout, "historia">) {
  if (historia.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-20 md:px-8 md:pb-28">
      <h2 className={`${titulo} mb-8`}>Nossas memórias</h2>
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {historia.map((m) => (
          <li key={m.id} className="grid items-center gap-4 rounded-3xl bg-areia p-4 sm:grid-cols-[1fr_auto_auto] sm:gap-8 sm:p-5">
            <div><p className="m-0 font-display text-2xl text-tinta">{m.title}</p><p className="m-0 mt-1 text-sm text-tinta-suave">{[m.dateLabel, m.description].filter(Boolean).join(" · ")}</p></div>
            {m.imageUrl && <div className="relative h-20 w-32 overflow-hidden rounded-xl max-sm:hidden"><Foto src={m.imageUrl} sizes="128px" /></div>}
            <span className="grid size-10 place-items-center rounded-full bg-[#CDB68A] text-[#2E211C] max-sm:hidden" aria-hidden="true"><ArrowUpRight className="size-4" /></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PresentesEmCartoes({ site, presentes, linkProps }: Pick<PropriedadesDoLayout, "site" | "presentes" | "linkProps">) {
  return (
    <section id="presentes" className="mx-auto max-w-[1200px] px-4 pb-20 md:px-8 md:pb-28">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><h2 className={titulo}>Um carinho para a vida nova</h2><Link href={site.giftsHref} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`} {...linkProps}>Ver todos</Link></div>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-4 p-0">
        {presentes.slice(0, 4).map((p) => (
          <li key={p.id}><Link href={`/checkout/${p.id}`} className="flex flex-col gap-3 rounded-3xl bg-papel p-3 text-tinta no-underline shadow-[var(--shadow-aceito-1)]" {...linkProps}>
            <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl"><Foto src={p.imageUrl} sizes="260px" /></span>
            <span className="px-2 pb-2"><strong className="block font-display text-xl font-medium leading-6">{p.title}</strong><span className="text-sm text-tinta-suave tabular-nums">{formatarReais(p.amount)}</span></span>
          </Link></li>
        ))}
      </ul>
    </section>
  );
}

export function DuvidasEmBarras({ dicas, fotos }: Pick<PropriedadesDoLayout, "dicas"> & { fotos: Fotos }) {
  return (
    <section id="dicas" className="mx-auto grid max-w-[1200px] gap-8 px-4 pb-20 md:grid-cols-[320px_1fr] md:gap-14 md:px-8 md:pb-28">
      <div className="arch relative hidden aspect-[3/4] overflow-hidden md:block"><Foto src={fotos.foto(8)} sizes="320px" /></div>
      <div className="flex flex-col gap-4"><h2 className={titulo}>Para aproveitar o dia</h2>
        {dicas.map((d) => (
          <details key={d.id} className="group rounded-3xl bg-areia px-5 py-1">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-tinta marker:hidden [&::-webkit-details-marker]:hidden">{d.title}<Plus className="size-5 shrink-0 transition-transform group-open:rotate-45" aria-hidden="true" /></summary>
            <div className="pb-4 text-sm leading-6 text-tinta-suave">{d.description && <p className="m-0 whitespace-pre-line">{d.description}</p>}{d.address && <p className="m-0 mt-1">{d.address}</p>}{d.discountCode && <p className="m-0 mt-1 font-semibold text-tinta">Cupom {d.discountCode}</p>}{d.linkUrl && <a href={d.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-ameixa underline">Abrir o site</a>}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function ConviteSobreAFoto({ site, linkProps, foto }: Pick<PropriedadesDoLayout, "site" | "linkProps"> & { foto: string | null }) {
  return (
    <section id="confirmar" className="relative isolate grid min-h-[420px] place-items-center overflow-hidden px-4 py-16">
      <div className="absolute inset-0 -z-10"><Foto src={foto} sizes="100vw" /></div>
      <div className="absolute inset-0 -z-10 bg-black/20" aria-hidden="true" />
      <div className="flex w-full max-w-[520px] flex-col items-center gap-4 rounded-3xl bg-papel p-8 text-center">
        <h2 className="m-0 font-display text-3xl leading-9 text-tinta">Contamos com você?</h2>
        <p className="m-0 text-sm leading-6 text-tinta-suave">{site.deadlineLabel ? `Confirme até ${site.deadlineLabel}. ` : ""}Leva menos de um minuto: é só informar o seu WhatsApp.</p>
        <Link href={site.rsvpHref} className={estiloDoBotao.primary} {...linkProps}>Confirmar presença</Link>
      </div>
    </section>
  );
}

export function RodapeOliva({ site }: Pick<PropriedadesDoLayout, "site">) {
  return (
    <footer className="bg-ameixa text-on-ameixa">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-10 md:px-8">
        <p className="m-0 font-display text-3xl">{site.coupleNames}</p>
        <p className="m-0 text-sm opacity-80">{site.dateLabel ? `${site.dateLabel} · ` : ""}Feito com Aceito</p>
      </div>
    </footer>
  );
}
