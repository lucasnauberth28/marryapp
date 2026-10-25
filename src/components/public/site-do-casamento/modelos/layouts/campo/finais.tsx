// Campo: os presentes com o código QR, as dicas e o convite final com o QR da confirmação.
import Link from "next/link";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";
import { QrDaPagina } from "./qr";
import { tituloManuscrito } from "./secoes";

export function PresentesDoCampo({ site, presentes, linkProps }: Pick<PropriedadesDoLayout, "site" | "presentes" | "linkProps">) {
  return (
    <section id="presentes" className="mx-auto max-w-[1200px] px-4 py-20 md:px-8 md:py-28">
      <div className="mb-12 grid items-center gap-8 md:grid-cols-[1fr_auto]"><div><h2 className={tituloManuscrito}>Um presente para o casal</h2><p className="m-0 mt-4 max-w-[52ch] text-tinta-suave">Sua presença é o nosso maior presente. Se quiser contribuir, escolha um item ou aponte a câmera para o código.</p></div><div className="text-tinta"><QrDaPagina href={site.giftsHref} rotulo="Ver presentes" linkProps={linkProps} /></div></div>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-6 p-0">
        {presentes.slice(0, 4).map((p) => <li key={p.id}><Link href={`/checkout/${p.id}`} className="flex flex-col gap-3 text-tinta no-underline" {...linkProps}><span className="relative block aspect-[4/5] overflow-hidden"><Foto src={p.imageUrl} sizes="260px" /></span><strong className="font-display text-xl font-semibold leading-6">{p.title}</strong><span className="text-sm text-tinta-suave tabular-nums">{formatarReais(p.amount)}</span></Link></li>)}
      </ul>
    </section>
  );
}

export function DicasDoCampo({ dicas }: Pick<PropriedadesDoLayout, "dicas">) {
  return (
    <section id="dicas" className="bg-areia"><div className="mx-auto max-w-[1200px] px-4 py-20 md:px-8 md:py-28">
      <h2 className={`${tituloManuscrito} mb-12 text-center`}>Dicas para o dia</h2>
      <div className="grid gap-10 md:grid-cols-3">
        {dicas.map((d) => <article key={d.id} className="flex flex-col gap-2 border-t-2 border-ameixa pt-4"><h3 className="m-0 font-display text-2xl font-semibold text-tinta">{d.title}</h3>{d.description && <p className="m-0 whitespace-pre-line text-sm leading-6 text-tinta-suave">{d.description}</p>}{d.address && <p className="m-0 text-sm text-tinta-suave">{d.address}</p>}{d.discountCode && <p className="m-0 text-sm font-semibold text-ameixa">Cupom {d.discountCode}</p>}{d.linkUrl && <a href={d.linkUrl} target="_blank" rel="noopener noreferrer" className="w-fit text-sm font-semibold text-ameixa underline">Abrir o site</a>}</article>)}
      </div>
    </div></section>
  );
}

export function ConviteDoCampo({ site, linkProps, foto }: Pick<PropriedadesDoLayout, "site" | "linkProps"> & { foto: string | null }) {
  return (
    <section id="confirmar" className="relative isolate overflow-hidden text-[#fff]">
      <div className="absolute inset-0 -z-10"><Foto src={foto} sizes="100vw" /></div><div className="absolute inset-0 -z-10 bg-[#2B3727]/70" aria-hidden="true" />
      <div className="mx-auto flex max-w-[900px] flex-col items-center gap-6 px-4 py-24 text-center md:py-32">
        <h2 className="m-0 font-[family-name:var(--font-modelo-great-vibes)] text-[clamp(52px,8vw,104px)] font-normal leading-none">Contamos com você</h2>
        <p className="m-0 max-w-[44ch] leading-7 opacity-90">{site.deadlineLabel ? `Confirme até ${site.deadlineLabel}. ` : ""}Aponte a câmera para o código ou toque no botão.</p>
        <QrDaPagina href={site.rsvpHref} rotulo="Confirmar presença" linkProps={linkProps} />
      </div>
    </section>
  );
}

export function RodapeDoCampo({ site }: Pick<PropriedadesDoLayout, "site">) {
  return <footer className="px-4 py-12 text-center"><p className="m-0 font-[family-name:var(--font-modelo-great-vibes)] text-5xl text-ameixa">{site.coupleNames}</p><p className="m-0 mt-2 text-sm text-tinta-suave">{site.dateLabel ? `${site.dateLabel} · ` : ""}Feito com Aceito</p></footer>;
}
