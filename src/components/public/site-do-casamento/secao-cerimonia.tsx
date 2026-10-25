// "O grande dia": local, links de mapa, horários e o traje sugerido.
import { MapPin } from "lucide-react";
import { estiloDoBotao, estiloDoSobretituloDaLanding } from "@/components/landing/styles";
import type { DadosDoSite, PropriedadesDeLink } from "./dados-do-site";
import { FaixaDaSecao, classeDoTitulo, estiloDoCartao } from "./pecas";

function BotaoDeRota({ href, curto, longo, linkProps, discreto }: { href: string; curto: string; longo: string; linkProps: PropriedadesDeLink; discreto: boolean }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm} ${discreto ? "sm:border-transparent sm:bg-transparent" : ""}`} {...linkProps}>
      <span className="sm:hidden">{curto}</span>
      <span className="hidden sm:inline">{longo}</span>
    </a>
  );
}

function LocalDaCerimonia({ site, linkProps }: { site: DadosDoSite; linkProps: PropriedadesDeLink }) {
  const { locationName, address, mapsUrl, wazeUrl, uberUrl } = site;
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className={estiloDoSobretituloDaLanding}>Local</p>
      {locationName && <h3 className="m-0 font-display text-2xl font-medium leading-[30px] text-tinta md:text-[26px] md:leading-8">{locationName}</h3>}
      {address && (
        <p className="m-0 flex gap-2 text-tinta-suave">
          <MapPin className="mt-1 size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0">{address}</span>
        </p>
      )}
      {(mapsUrl || wazeUrl || uberUrl) && (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap [&>*:last-child:nth-child(odd)]:max-sm:col-span-2">
          {mapsUrl && <BotaoDeRota href={mapsUrl} curto="Google Maps" longo="Abrir no Google Maps" linkProps={linkProps} discreto={false} />}
          {wazeUrl && <BotaoDeRota href={wazeUrl} curto="Waze" longo="Abrir no Waze" linkProps={linkProps} discreto />}
          {uberUrl && <BotaoDeRota href={uberUrl} curto="Uber" longo="Chamar um Uber" linkProps={linkProps} discreto />}
        </div>
      )}
    </div>
  );
}

function HorariosDaCerimonia({ site }: { site: DadosDoSite }) {
  const itens = [["Cerimônia", site.ceremonyTime], ["Recepção", site.receptionTime]].filter(([, hora]) => hora);
  return (
    <dl className="m-0 flex flex-col justify-center gap-4 border-t border-linha pt-6 md:border-l md:border-t-0 md:pl-12 md:pt-0">
      {itens.map(([nome, hora]) => (
        <div key={nome}>
          <dt className={estiloDoSobretituloDaLanding}>{nome}</dt>
          <dd className="m-0 font-num text-4xl leading-[44px] text-ameixa tabular-nums">{hora}</dd>
        </div>
      ))}
    </dl>
  );
}

function BlocoDoLocal({ site, linkProps }: { site: DadosDoSite; linkProps: PropriedadesDeLink }) {
  const dia = site.weekdayLabel;
  return (
    <>
      <div className="flex flex-col items-start gap-3 md:items-center md:text-center">
        <p className={estiloDoSobretituloDaLanding}>O grande dia</p>
        <h2 className={classeDoTitulo}>{dia ? dia.charAt(0).toUpperCase() + dia.slice(1) : "Onde vamos celebrar"}</h2>
      </div>
      <article className={`${estiloDoCartao} grid gap-6 md:grid-cols-[1.4fr_1fr] md:gap-12`}>
        <LocalDaCerimonia site={site} linkProps={linkProps} />
        {(site.ceremonyTime || site.receptionTime) && <HorariosDaCerimonia site={site} />}
      </article>
    </>
  );
}

function TrajeDoDia({ site, linkProps }: { site: DadosDoSite; linkProps: PropriedadesDeLink }) {
  const { s, palette } = site;
  return (
    <div className="flex flex-wrap items-center gap-x-12 gap-y-4 rounded-2xl bg-areia p-6">
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
        <p className={estiloDoSobretituloDaLanding}>Traje</p>
        {s.dressCodeTitle && <p className="m-0 text-[17px] leading-7 text-tinta md:text-lg">{s.dressCodeTitle}</p>}
        {s.dressCodeDesc && <p className="m-0 whitespace-pre-line text-tinta-suave">{s.dressCodeDesc}</p>}
        {palette.length > 0 && (
          <ul className="m-0 mt-3 flex list-none flex-wrap items-center gap-3 p-0" aria-label="Cores sugeridas">
            {palette.map((cor) => (
              <li key={cor} className="size-10 rounded-full border-2 border-papel shadow-[var(--shadow-aceito-1)] ring-1 ring-linha" style={{ backgroundColor: cor }} title={cor} aria-label={`Cor ${cor}`} />
            ))}
          </ul>
        )}
      </div>
      {site.showTips && <a href="#dicas" className={estiloDoBotao.quiet} {...linkProps}>Ver dicas para o dia</a>}
    </div>
  );
}

export function SecaoDaCerimonia({ site, linkProps }: { site: DadosDoSite; linkProps: PropriedadesDeLink }) {
  return (
    <FaixaDaSecao id="cerimonia" tone={site.toneOf("cerimonia")}>
      {site.showLocation && <BlocoDoLocal site={site} linkProps={linkProps} />}
      {site.showDress && <TrajeDoDia site={site} linkProps={linkProps} />}
    </FaixaDaSecao>
  );
}
