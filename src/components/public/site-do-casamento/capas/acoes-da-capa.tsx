// Botões da capa (confirmar presença e ver presentes) e o aviso do prazo; iguais em todos os modelos.
import Link from "next/link";
import { estiloDoBotao } from "@/components/landing/styles";
import type { DadosDoSite, PropriedadesDeLink } from "../dados-do-site";

export function AcoesDaCapa({ site, linkProps, centralizar = true }: { site: DadosDoSite; linkProps: PropriedadesDeLink; centralizar?: boolean }) {
  const { showRsvp, showGiftLink } = site;
  const alinhamento = centralizar ? "justify-center" : "justify-start";
  return (
    <>
      {(showRsvp || showGiftLink) && (
        <div className={`flex flex-wrap gap-3 ${alinhamento}`}>
          {showRsvp && <Link href={site.rsvpHref} className={estiloDoBotao.primary} {...linkProps}>Confirmar presença</Link>}
          {showGiftLink && <Link href={site.giftsHref} className={estiloDoBotao.secondary} {...linkProps}>Ver presentes em dinheiro</Link>}
        </div>
      )}
      {showRsvp && site.deadlineLabel && <p className="m-0 text-sm opacity-80">Pedimos que confirme até {site.deadlineLabel}.</p>}
    </>
  );
}
