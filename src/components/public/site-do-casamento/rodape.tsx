// Rodapé do site e a barra fixa do celular com os botões principais.
import Link from "next/link";
import { Gift } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import type { DadosDoSite } from "./dados-do-site";
import { TextoDeIniciais } from "./pecas";

export function RodapeDoSite({ site }: { site: DadosDoSite }) {
  return (
    <footer className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <p className="m-0 font-display text-[34px] leading-10 text-tinta"><TextoDeIniciais initials={site.initials} /></p>
      <p className="m-0 text-sm text-tinta-suave">{site.dateLabel ? `${site.dateLabel} · ` : ""}Feito com Aceito</p>
    </footer>
  );
}

/** Celular: o botão principal sempre à mão (sticky: o pai da rota tem transform, que quebraria o fixed). */
export function BarraFixaDoCelular({ site }: { site: DadosDoSite }) {
  const { showRsvp, showGiftLink } = site;
  if (!showRsvp && !showGiftLink) return null;
  return (
    <div className="sticky bottom-0 z-30 flex gap-2 border-t border-linha bg-papel px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[var(--shadow-aceito-2)] lg:hidden">
      {showRsvp ? (
        <Link href={site.rsvpHref} className={`${estiloDoBotao.primary} flex-1`}>Confirmar presença</Link>
      ) : (
        <Link href={site.giftsHref} className={`${estiloDoBotao.primary} flex-1`}>Presentes em dinheiro</Link>
      )}
      {showRsvp && showGiftLink && (
        <Link href={site.giftsHref} aria-label="Presentes em dinheiro" className={`${estiloDoBotao.secondary} px-3.5`}>
          <Gift className="size-6" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
