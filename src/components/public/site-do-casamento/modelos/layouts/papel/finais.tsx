// Papel rasgado: presentes em polaroids, dicas em pílulas que abrem e o convite final sobre a foto.
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";
import { botaoEscuro, tituloDaFolha } from "./folhas";

export function PolaroidsDePresentes({ site, presentes, linkProps }: Pick<PropriedadesDoLayout, "site" | "presentes" | "linkProps">) {
  return (
    <section id="presentes" className="papel-folha bg-papel">
      <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
        <h2 className={`${tituloDaFolha} mb-3`}>Presentes em dinheiro</h2>
        <p className="m-0 mb-10 max-w-[52ch] text-tinta-suave">Cada item é um valor em dinheiro para o casal. Escolha o que tiver significado para você.</p>
        <ul className="m-0 grid list-none gap-6 p-0 grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))]">
          {presentes.slice(0, 6).map((p) => (
            <li key={p.id} className="flex flex-col gap-3 bg-areia p-3 pb-5 shadow-[0_10px_24px_-14px_rgb(0_0_0/0.4)]">
              <div className="relative aspect-[4/3] overflow-hidden"><Foto src={p.imageUrl} sizes="(min-width: 1024px) 360px, 90vw" /><span className="absolute left-0 top-3 max-w-[85%] bg-ameixa px-3 py-1.5 text-sm font-semibold text-on-ameixa">{p.title}</span></div>
              <p className="m-0 px-1 text-sm text-tinta-suave tabular-nums">{formatarReais(p.amount)}</p>
              <Link href={`/checkout/${p.id}`} className={`${botaoEscuro} mx-1 !min-h-11 text-sm`} {...linkProps}>Presentear</Link>
            </li>
          ))}
        </ul>
        <Link href={site.giftsHref} className="mt-8 inline-block border-b border-tinta pb-0.5 text-sm font-semibold uppercase tracking-[0.14em] text-tinta no-underline" {...linkProps}>Ver todos os presentes</Link>
      </div>
    </section>
  );
}

export function PerguntasEmPilulas({ dicas }: Pick<PropriedadesDoLayout, "dicas">) {
  return (
    <section id="dicas" className="papel-folha bg-papel">
      <div className="mx-auto max-w-[760px] px-4 py-16 md:py-24">
        <h2 className={`${tituloDaFolha} mb-8`}>Dicas para o dia</h2>
        <div className="flex flex-col gap-3">
          {dicas.map((d) => (
            <details key={d.id} className="group rounded-xl bg-ameixa text-on-ameixa">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                {d.title}
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-on-ameixa/70"><Plus className="size-4 transition-transform group-open:rotate-45" aria-hidden="true" /></span>
              </summary>
              <div className="px-5 pb-5 text-sm leading-6 opacity-90">
                {d.description && <p className="m-0 whitespace-pre-line">{d.description}</p>}
                {d.address && <p className="m-0 mt-2">{d.address}</p>}
                {d.discountCode && <p className="m-0 mt-2 font-semibold">Cupom {d.discountCode}</p>}
                {d.linkUrl && <a href={d.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block underline">Abrir o site</a>}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ConviteFinal({ site, linkProps, foto }: Pick<PropriedadesDoLayout, "site" | "linkProps"> & { foto: string | null }) {
  return (
    <section id="confirmar" className="relative isolate flex min-h-[78vh] flex-col items-center justify-center gap-8 overflow-hidden px-4 py-24 text-center text-[#fff]">
      <div className="absolute inset-0 -z-10"><Foto src={foto} sizes="100vw" /></div>
      <div className="absolute inset-0 -z-10 bg-black/35" aria-hidden="true" />
      <h2 className="m-0 max-w-[16ch] font-display text-[clamp(40px,8vw,96px)] font-normal uppercase leading-[0.98] [text-shadow:0_2px_30px_rgb(0_0_0/0.35)]">Vamos celebrar juntos</h2>
      <Link href={site.rsvpHref} className={botaoEscuro} {...linkProps}>Confirmar presença</Link>
      <p className="m-0 text-xs opacity-80">{site.dateLabel ? `${site.dateLabel} · ` : ""}Feito com Aceito</p>
    </section>
  );
}
