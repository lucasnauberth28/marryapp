// Floral rosé: as dicas em colunas, cada uma com um ícone de traço fino.
import { Bus, ExternalLink, Hotel, MapPin, Scissors, Shirt, Tag, type LucideIcon } from "lucide-react";
import type { PropriedadesDoLayout } from "../tipos";

const ICONES: Record<string, LucideIcon> = { HOTEL: Hotel, SALON: Scissors, TRANSFER: Bus, DRESS: Shirt };

export function DuvidasEmColunas({ dicas }: Pick<PropriedadesDoLayout, "dicas">) {
  return (
    <section id="dicas" className="bg-areia">
      <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
        <h2 className="m-0 mb-10 text-center font-display text-[clamp(32px,4.4vw,52px)] font-semibold leading-[1.08] text-tinta">Para aproveitar o dia</h2>
        <ul className="m-0 grid list-none gap-8 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {dicas.map((d) => {
            const Icone = ICONES[d.category] ?? MapPin;
            return (
              <li key={d.id} className="flex flex-col items-start gap-2">
                <Icone className="size-8 text-ameixa" strokeWidth={1.4} aria-hidden="true" />
                <h3 className="m-0 font-display text-2xl font-semibold text-tinta">{d.title}</h3>
                {d.description && <p className="m-0 whitespace-pre-line text-sm leading-6 text-tinta-suave">{d.description}</p>}
                {d.address && <p className="m-0 text-sm text-tinta-suave">{d.address}</p>}
                {d.discountCode && <p className="m-0 inline-flex items-center gap-1.5 text-sm font-semibold text-ameixa"><Tag className="size-4" aria-hidden="true" />Cupom {d.discountCode}</p>}
                {d.linkUrl && <a href={d.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-ameixa">Abrir o site <ExternalLink className="size-3.5" aria-hidden="true" /></a>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
