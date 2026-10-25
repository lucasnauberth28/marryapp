// Monocromático: galeria em preto e branco, presentes em tabela, dicas em duas colunas e o rodapé preto.
import Link from "next/link";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";
import { titulo } from "./secoes";

const rotulo = "m-0 text-[11px] uppercase tracking-[0.3em] text-tinta-suave";

export function GaleriaEmPretoEBranco({ fotos }: { fotos: { foto: (i: number) => string | null } }) {
  return (
    <section id="galeria" className="mx-auto grid max-w-[1200px] grid-cols-3 gap-2 px-4 pb-20 md:gap-4 md:px-8 md:pb-28">
      {[2, 3, 4].map((i) => <div key={i} className="relative aspect-[3/4] overflow-hidden"><Foto src={fotos.foto(i)} sizes="400px" className="grayscale" /></div>)}
    </section>
  );
}

export function PresentesEmTabela({ site, presentes, linkProps }: Pick<PropriedadesDoLayout, "site" | "presentes" | "linkProps">) {
  return (
    <section id="presentes" className="mx-auto max-w-[1200px] px-4 pb-20 md:px-8 md:pb-28">
      <p className={rotulo}>Presentes em dinheiro</p>
      <h2 className={`${titulo} mb-10 mt-3`}>Um carinho para a vida nova</h2>
      <ul className="m-0 grid list-none gap-px bg-linha p-0 sm:grid-cols-2 lg:grid-cols-4">
        {presentes.slice(0, 4).map((p) => (
          <li key={p.id} className="bg-linho"><Link href={`/checkout/${p.id}`} className="flex flex-col gap-3 p-4 text-tinta no-underline hover:bg-papel" {...linkProps}>
            <span className="relative block aspect-square overflow-hidden"><Foto src={p.imageUrl} sizes="280px" className="grayscale" /></span>
            <strong className="font-display text-xl font-normal leading-6">{p.title}</strong>
            <span className="text-[11px] uppercase tracking-[0.2em] text-tinta-suave tabular-nums">{formatarReais(p.amount)}</span>
          </Link></li>
        ))}
      </ul>
      <Link href={site.giftsHref} className="mt-6 inline-block border-b border-tinta pb-1 text-[11px] uppercase tracking-[0.3em] text-tinta no-underline" {...linkProps}>Ver todos</Link>
    </section>
  );
}

export function DicasDeViagem({ dicas }: Pick<PropriedadesDoLayout, "dicas">) {
  return (
    <section id="dicas" className="mx-auto grid max-w-[1200px] gap-10 px-4 pb-20 md:grid-cols-[1fr_1.4fr] md:px-8 md:pb-28">
      <div><p className={rotulo}>Viagem e hospedagem</p><h2 className={`${titulo} mt-3`}>Para se programar</h2></div>
      <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
        {dicas.map((d) => (
          <article key={d.id} className="flex flex-col gap-2 border-t border-tinta pt-4"><h3 className="m-0 font-display text-2xl font-normal text-tinta">{d.title}</h3>
            {d.description && <p className="m-0 whitespace-pre-line text-sm leading-6 text-tinta-suave">{d.description}</p>}
            {d.address && <p className="m-0 text-sm text-tinta-suave">{d.address}</p>}
            {d.discountCode && <p className={`${rotulo} !text-tinta`}>Cupom {d.discountCode}</p>}
            {d.linkUrl && <a href={d.linkUrl} target="_blank" rel="noopener noreferrer" className="w-fit border-b border-tinta pb-0.5 text-[11px] uppercase tracking-[0.24em] text-tinta no-underline">Abrir o site</a>}
          </article>
        ))}
      </div>
    </section>
  );
}

export function RodapePreto({ site }: Pick<PropriedadesDoLayout, "site">) {
  return (
    <footer className="bg-tinta text-linho"><div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-10 md:px-8"><p className="m-0 text-sm tracking-[0.3em]">{site.initials.replace("&", " | ")}</p><p className="m-0 text-[11px] uppercase tracking-[0.24em] opacity-70">{site.dateLabel ? `${site.dateLabel} · ` : ""}Feito com Aceito</p></div></footer>
  );
}
