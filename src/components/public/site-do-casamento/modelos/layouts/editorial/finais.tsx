// Editorial: presentes em linhas, dicas em duas colunas de texto, o convite e o rodapé tipográfico.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";
import { titulo } from "./secoes";

const rotulo = "m-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-ameixa";

export function PresentesEmLinhas({ site, presentes, linkProps }: Pick<PropriedadesDoLayout, "site" | "presentes" | "linkProps">) {
  return (
    <section id="presentes" className="mx-auto max-w-[1200px] px-4 pb-20 md:px-8 md:pb-32">
      <h2 className={`${titulo} mb-10`}>Presentes</h2>
      <ul className="m-0 flex list-none flex-col p-0">
        {presentes.slice(0, 5).map((p) => (
          <li key={p.id} className="border-t border-tinta last:border-b"><Link href={`/checkout/${p.id}`} className="grid grid-cols-[72px_1fr_auto] items-center gap-5 py-4 text-tinta no-underline hover:text-ameixa" {...linkProps}>
            <span className="relative block aspect-square overflow-hidden"><Foto src={p.imageUrl} sizes="72px" /></span>
            <span className="font-display text-2xl md:text-3xl">{p.title}</span>
            <span className="flex items-center gap-3 text-sm tabular-nums">{formatarReais(p.amount)}<ArrowRight className="size-4" aria-hidden="true" /></span>
          </Link></li>
        ))}
      </ul>
      <Link href={site.giftsHref} className={`${rotulo} mt-6 inline-block border-b border-ameixa pb-1 no-underline`} {...linkProps}>Ver todos os presentes</Link>
    </section>
  );
}

export function DicasEmTexto({ dicas }: Pick<PropriedadesDoLayout, "dicas">) {
  return (
    <section id="dicas" className="mx-auto grid max-w-[1200px] gap-10 px-4 pb-20 md:grid-cols-[1fr_1.2fr] md:gap-16 md:px-8 md:pb-32">
      <h2 className={titulo}>Para<br />se hospedar</h2>
      <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {dicas.map((d) => (
          <article key={d.id} className="flex flex-col gap-2"><h3 className="m-0 font-display text-2xl text-tinta">{d.title}</h3>
            {d.description && <p className="m-0 whitespace-pre-line text-sm leading-6 text-tinta-suave">{d.description}</p>}
            {d.address && <p className="m-0 text-sm text-tinta-suave">{d.address}</p>}
            {d.discountCode && <p className={rotulo}>Cupom {d.discountCode}</p>}
            {d.linkUrl && <a href={d.linkUrl} target="_blank" rel="noopener noreferrer" className={`${rotulo} w-fit border-b border-ameixa pb-0.5 no-underline`}>Abrir o site</a>}
          </article>
        ))}
      </div>
    </section>
  );
}

export function ConviteEditorial({ site, linkProps, foto }: Pick<PropriedadesDoLayout, "site" | "linkProps"> & { foto: string | null }) {
  return (
    <section id="confirmar" className="grid md:grid-cols-2">
      <div className="relative min-h-[320px] overflow-hidden"><Foto src={foto} sizes="50vw" className="grayscale" /></div>
      <div className="flex flex-col justify-center gap-6 bg-areia px-6 py-16 md:px-16">
        <h2 className={titulo}>Confirme<br />sua presença</h2>
        <p className="m-0 max-w-[36ch] text-[15px] leading-6 text-tinta-suave">{site.deadlineLabel ? `Responda até ${site.deadlineLabel}. ` : ""}Leva menos de um minuto: é só informar o seu WhatsApp.</p>
        <Link href={site.rsvpHref} className="inline-flex min-h-12 w-fit items-center gap-3 bg-ameixa px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-on-ameixa no-underline" {...linkProps}>Responder convite <ArrowRight className="size-4" aria-hidden="true" /></Link>
      </div>
    </section>
  );
}

export function RodapeEditorial({ site }: Pick<PropriedadesDoLayout, "site">) {
  return (
    <footer className="mx-auto flex max-w-[1200px] flex-wrap items-baseline justify-between gap-3 px-4 py-12 md:px-8">
      <p className="m-0 font-display text-4xl text-tinta">{site.initials}</p>
      <p className={rotulo}>{site.dateLabel ? `${site.dateLabel} · ` : ""}Feito com Aceito</p>
    </footer>
  );
}
