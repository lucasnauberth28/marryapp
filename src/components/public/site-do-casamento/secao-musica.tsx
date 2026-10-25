// A playlist da festa: um cartão com o link do Spotify.
import { ExternalLink, Music } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import type { DadosDoSite, PropriedadesDeLink } from "./dados-do-site";
import { FaixaDaSecao, estiloDoCartao } from "./pecas";

export function SecaoDaMusica({ site, linkProps }: { site: DadosDoSite; linkProps: PropriedadesDeLink }) {
  return (
    <FaixaDaSecao tone={site.toneOf("musica")} compact>
      <div className={`${estiloDoCartao} flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left`}>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-ameixa-suave text-ameixa">
          <Music className="size-6" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <h2 className="m-0 font-display text-2xl font-medium leading-8 text-tinta">A trilha sonora da festa</h2>
          <p className="m-0 text-tinta-suave">Ouça a nossa playlist e entre no clima.</p>
        </div>
        <a href={site.s.spotifyPlaylistUrl!} target="_blank" rel="noopener noreferrer" className={estiloDoBotao.secondary} {...linkProps}>
          Ouvir playlist <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>
    </FaixaDaSecao>
  );
}
