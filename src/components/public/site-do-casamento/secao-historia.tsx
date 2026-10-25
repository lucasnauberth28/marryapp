// "Nossa história": fotos em arco e a linha do tempo do casal.
import { estiloDoSobretituloDaLanding } from "@/components/landing/styles";
import type { DadosDoSite } from "./dados-do-site";
import { FaixaDaSecao, FotoEmArco, classeDoTitulo } from "./pecas";
import type { ItemDaHistoria } from "./tipos";

interface ArcoDaHistoria {
  src: string;
  alt: string;
  itemId: string | null;
}

/** Fotos em arco da história: a do casal e as das cenas, no máximo duas; as demais ficam na linha do tempo. */
function arcosDaHistoria(site: DadosDoSite, itens: ItemDaHistoria[]): ArcoDaHistoria[] {
  const doCasal = site.storyCouplePhoto ? { src: site.storyCouplePhoto, alt: `Foto de ${site.coupleNames}`, itemId: null as string | null } : null;
  const dasCenas = itens.filter((i) => i.imageUrl).map((i) => ({ src: i.imageUrl as string, alt: i.title, itemId: i.id as string | null }));
  return [doCasal, ...dasCenas].filter((a): a is ArcoDaHistoria => a !== null).slice(0, 2);
}

function FotosDaHistoria({ arcos }: { arcos: ArcoDaHistoria[] }) {
  return (
    <div className="flex items-end justify-center gap-3 md:row-span-2 md:row-start-1 md:gap-6">
      {arcos.map((a, i) => (
        <FotoEmArco key={a.src} src={a.src} alt={a.alt} ratio={i === 0 ? "aspect-[2/3]" : "aspect-[3/4]"} sizes="(min-width: 768px) 200px, 45vw" className={`min-w-0 flex-1 ${i === 0 ? "md:w-[200px] md:flex-none" : "md:w-[150px] md:flex-none"}`} />
      ))}
    </div>
  );
}

function LinhaDoTempo({ itens, idsComArco }: { itens: ItemDaHistoria[]; idsComArco: Set<string | null> }) {
  return (
    <ol className="m-0 mt-2 flex list-none flex-col gap-5 border-l border-rosa p-0 pl-6">
      {itens.map((item) => (
        <li key={item.id} className="flex items-start gap-4">
          {item.imageUrl && !idsComArco.has(item.id) && <FotoEmArco src={item.imageUrl} alt={item.title} sizes="88px" className="w-[72px] shrink-0 md:w-[88px]" />}
          <div className="min-w-0">
            {item.dateLabel && <p className="m-0 font-display text-xl text-ameixa">{item.dateLabel}</p>}
            <h3 className="m-0 font-display text-[22px] font-medium leading-7 text-tinta">{item.title}</h3>
            <p className="m-0 mt-1 whitespace-pre-line text-tinta-suave">{item.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function SecaoDaHistoria({ site, itens }: { site: DadosDoSite; itens: ItemDaHistoria[] }) {
  const arcos = arcosDaHistoria(site, itens);
  const idsComArco = new Set(arcos.map((a) => a.itemId));
  return (
    <FaixaDaSecao id="historia" tone={site.toneOf("historia")}>
      <div className={`grid items-center gap-6 md:gap-x-16 md:gap-y-4 ${arcos.length > 0 ? "md:grid-cols-2" : "mx-auto w-full max-w-[720px]"}`}>
        <div className="flex flex-col gap-3 md:self-end">
          <p className={estiloDoSobretituloDaLanding}>Nossa história</p>
          <h2 className={classeDoTitulo}>Como tudo começou</h2>
        </div>
        {arcos.length > 0 && <FotosDaHistoria arcos={arcos} />}
        <div className="flex min-w-0 flex-col gap-4 md:self-start">
          {site.s.welcomeMessage?.trim() && <p className="m-0 max-w-[60ch] whitespace-pre-line text-[17px] leading-[26px] text-tinta-suave md:text-lg md:leading-7">{site.s.welcomeMessage.trim()}</p>}
          {itens.length > 0 && <LinhaDoTempo itens={itens} idsComArco={idsComArco} />}
        </div>
      </div>
    </FaixaDaSecao>
  );
}
