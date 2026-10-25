// A carta aberta: foto, nomes, data, local, frase do casal e os botões para confirmar presença.
import Link from "next/link";
import { MapPin } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { ContagemRegressivaDoCasamento } from "@/components/public/wedding-site-countdown";
import type { DadosDoSite } from "@/components/public/site-do-casamento/dados-do-site";
import { NomesDoCasal, TextoDeIniciais } from "@/components/public/site-do-casamento/pecas";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import { Petalas } from "./petalas";

const FRASE_PADRAO = "Será uma alegria celebrar esse dia com você.";

function Foto({ site }: { site: DadosDoSite }) {
  return (
    <div className="arch relative aspect-[4/5] w-[260px] max-w-[78%] overflow-hidden bg-areia outline outline-1 outline-offset-[6px] outline-rosa md:w-[320px]">
      {site.coverUrl ? (
        <ImagemDaPessoa src={site.coverUrl} alt={`Foto de ${site.coupleNames}`} sizes="320px" priority className="cd-zoom object-cover" />
      ) : (
        <span className="absolute inset-0 grid place-items-center font-display text-6xl text-ameixa" aria-hidden="true"><TextoDeIniciais initials={site.initials} /></span>
      )}
    </div>
  );
}

function Quando({ site }: { site: DadosDoSite }) {
  const horarios = [site.ceremonyTime && `Cerimônia às ${site.ceremonyTime}`, site.receptionTime && `Recepção às ${site.receptionTime}`].filter(Boolean);
  return (
    <div className="flex flex-col items-center gap-1.5">
      {site.weekdayLabel ? <p className="m-0 font-display text-2xl text-tinta md:text-3xl">{site.weekdayLabel.charAt(0).toUpperCase() + site.weekdayLabel.slice(1)}</p> : null}
      {site.dateLabel ? <p className="m-0 text-sm text-tinta-suave">{site.dateLabel}</p> : null}
      {horarios.length > 0 ? <p className="m-0 text-base text-tinta">{horarios.join(" · ")}</p> : null}
      {site.locationName || site.address ? (
        <p className="m-0 flex max-w-[44ch] items-start justify-center gap-1.5 text-tinta-suave">
          <MapPin className="mt-1 size-4 shrink-0" aria-hidden="true" />
          <span>{[site.locationName, site.address].filter(Boolean).join(" · ")}</span>
        </p>
      ) : null}
    </div>
  );
}

function Botoes({ site, enderecoDoSite }: { site: DadosDoSite; enderecoDoSite: string }) {
  return (
    <div className="flex w-full max-w-[420px] flex-col gap-3">
      {site.showRsvp ? <Link href={site.rsvpHref} className={`${estiloDoBotao.primary} ${estiloDoBotao.block}`}>Confirmar presença</Link> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {site.mapsUrl ? <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className={`${estiloDoBotao.secondary} ${estiloDoBotao.block}`}>Como chegar</a> : null}
        <Link href={enderecoDoSite} className={`${estiloDoBotao.secondary} ${estiloDoBotao.block} ${site.mapsUrl ? "" : "sm:col-span-2"}`}>Ver o site</Link>
      </div>
      {site.showGiftLink ? <Link href={site.giftsHref} className={`${estiloDoBotao.quiet} ${estiloDoBotao.block}`}>Ver presentes em dinheiro</Link> : null}
    </div>
  );
}

export function Carta({ site, nomeDoConvidado, frase, enderecoDoSite }: { site: DadosDoSite; nomeDoConvidado: string | null; frase: string | null; enderecoDoSite: string }) {
  const itens = [
    <Foto key="foto" site={site} />,
    <p key="tema" className="m-0 max-w-[36ch] font-display text-xl text-tinta-suave md:text-2xl">{nomeDoConvidado ? `${nomeDoConvidado}, queremos você com a gente` : "Queremos você com a gente"}</p>,
    <h1 key="nomes" className="m-0 max-w-full font-display text-[48px] font-medium leading-[1.02] tracking-[-0.02em] text-tinta text-balance md:text-[72px]"><NomesDoCasal names={site.coupleNames} /></h1>,
    <Quando key="quando" site={site} />,
    <p key="frase" className="m-0 max-w-[42ch] whitespace-pre-line text-[17px] leading-7 text-tinta-suave">{frase || FRASE_PADRAO}</p>,
    site.countdownTarget !== null ? <ContagemRegressivaDoCasamento key="contagem" target={site.countdownTarget} /> : null,
    <Botoes key="botoes" site={site} enderecoDoSite={enderecoDoSite} />,
  ].filter(Boolean);
  return (
    <main className="cd-carta">
      <Petalas />
      <div className="relative mx-auto flex min-h-dvh max-w-[640px] flex-col items-center justify-center gap-6 px-5 py-14 text-center">
        {itens.map((item, i) => <div key={i} className="cd-entra flex w-full flex-col items-center" style={{ "--i": i } as React.CSSProperties}>{item}</div>)}
        <p className="cd-entra m-0 text-xs text-tinta-suave" style={{ "--i": itens.length } as React.CSSProperties}>Convite digital · Feito com Aceito</p>
      </div>
    </main>
  );
}
