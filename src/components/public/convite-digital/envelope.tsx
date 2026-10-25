// O envelope fechado: selo com as iniciais e, se o casal quiser, o nome de quem recebe.
import type { FaseDoConvite } from "./use-abertura";

export function Envelope({ iniciais, nomeDoConvidado, fase, aoAbrir }: { iniciais: string; nomeDoConvidado: string | null; fase: FaseDoConvite; aoAbrir: () => void }) {
  return (
    <div className="cd-palco" data-fase={fase}>
      <button type="button" className="cd-envelope" onClick={aoAbrir} aria-label={nomeDoConvidado ? `Abrir o convite de ${nomeDoConvidado}` : "Abrir o convite"}>
        <span className="cd-corpo" aria-hidden="true" />
        <span className="cd-papel" aria-hidden="true" />
        <span className="cd-bolso" aria-hidden="true" />
        {nomeDoConvidado ? <span className="cd-para" aria-hidden="true">Para {nomeDoConvidado}</span> : null}
        <span className="cd-aba" aria-hidden="true" />
        <span className="cd-selo" aria-hidden="true">{iniciais}</span>
      </button>
      <p className="cd-dica m-0 text-xs font-semibold uppercase text-tinta-suave" aria-hidden="true">Toque para abrir</p>
    </div>
  );
}
