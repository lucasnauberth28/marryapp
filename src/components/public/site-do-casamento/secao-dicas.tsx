// Dicas aos convidados: hospedagem, beleza e transporte que o casal indica.
import { ExternalLink, MapPin, Phone, Tag } from "lucide-react";
import { estiloDoSobretituloDaLanding } from "@/components/landing/styles";
import type { DadosDoSite, PropriedadesDeLink } from "./dados-do-site";
import { FaixaDaSecao, TituloDaSecao, estiloDoCartao } from "./pecas";
import { CATEGORIAS_DE_DICAS, type DicaDoSite } from "./tipos";

function ContatosDaDica({ dica }: { dica: DicaDoSite }) {
  return (
    <div className="flex flex-col gap-1 text-sm text-tinta-suave">
      {dica.address && (
        <span className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {dica.address}
        </span>
      )}
      {dica.phone && (
        <span className="flex items-center gap-2">
          <Phone className="size-4 shrink-0" aria-hidden="true" /> {dica.phone}
        </span>
      )}
    </div>
  );
}

function CupomELinkDaDica({ dica, linkProps }: { dica: DicaDoSite; linkProps: PropriedadesDeLink }) {
  return (
    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
      {dica.discountCode && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ameixa/25 bg-ameixa-suave px-3 py-1 text-xs font-semibold text-ameixa">
          <Tag className="size-3.5" aria-hidden="true" /> Cupom {dica.discountCode}
        </span>
      )}
      {dica.linkUrl && (
        <a href={dica.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 font-semibold text-ameixa hover:underline" {...linkProps}>
          Ver site <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

function CartaoDaDica({ dica, linkProps }: { dica: DicaDoSite; linkProps: PropriedadesDeLink }) {
  const categoria = CATEGORIAS_DE_DICAS[dica.category] ?? { label: "Dica", icon: MapPin };
  const Icone = categoria.icon;
  return (
    <li className={`${estiloDoCartao} flex flex-col gap-3`}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ameixa-suave text-ameixa">
          <Icone className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={estiloDoSobretituloDaLanding}>{categoria.label}</p>
          <h3 className="m-0 font-display text-[22px] font-medium leading-7 text-tinta">{dica.title}</h3>
        </div>
      </div>
      {dica.description && <p className="m-0 whitespace-pre-line text-tinta-suave">{dica.description}</p>}
      {(dica.address || dica.phone) && <ContatosDaDica dica={dica} />}
      {(dica.discountCode || dica.linkUrl) && <CupomELinkDaDica dica={dica} linkProps={linkProps} />}
    </li>
  );
}

export function SecaoDeDicas({ site, dicas, linkProps }: { site: DadosDoSite; dicas: DicaDoSite[]; linkProps: PropriedadesDeLink }) {
  return (
    <FaixaDaSecao id="dicas" tone={site.toneOf("dicas")}>
      <TituloDaSecao title="Dicas para aproveitar o dia">Hospedagem, beleza e transporte que indicamos.</TituloDaSecao>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6 p-0">
        {dicas.map((dica) => <CartaoDaDica key={dica.id} dica={dica} linkProps={linkProps} />)}
      </ul>
    </FaixaDaSecao>
  );
}
