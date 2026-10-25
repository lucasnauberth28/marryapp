// "Nossos momentos": a galeria de fotos que o casal enviou.
import { ImagemDaPessoa } from "@/components/ui/user-image";
import type { DadosDoSite } from "./dados-do-site";
import { FaixaDaSecao, TituloDaSecao } from "./pecas";

/** A primeira foto ocupa duas colunas quando a galeria tem foto de sobra, para o desenho não ficar uniforme demais. */
function classeDaFoto(indice: number, total: number) {
  return indice === 0 && total >= 3 ? "col-span-2 row-span-2 aspect-square" : "aspect-[4/5]";
}

export function SecaoDaGaleria({ site }: { site: DadosDoSite }) {
  const fotos = site.galleryPhotos;
  return (
    <FaixaDaSecao id="galeria" tone={site.toneOf("galeria")}>
      <TituloDaSecao eyebrow="Fotos" title="Nossos momentos" />
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-4 md:gap-4">
        {fotos.map((src, i) => (
          <li key={src} className={`foto-da-galeria relative overflow-hidden bg-areia ${classeDaFoto(i, fotos.length)}`}>
            <ImagemDaPessoa src={src} alt={`Foto ${i + 1} de ${site.coupleNames}`} sizes="(min-width: 768px) 280px, 50vw" className="object-cover" />
          </li>
        ))}
      </ul>
    </FaixaDaSecao>
  );
}
