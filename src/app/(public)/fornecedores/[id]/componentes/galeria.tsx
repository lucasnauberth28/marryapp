import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { Dialogo, ConteudoDoDialogo, DescricaoDoDialogo, TituloDoDialogo } from "@/components/ui/dialog";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import { cn } from "@/lib/utils";

/** Com menos de 5 fotos, as pequenas crescem para o mosaico não ficar com buraco. */
function celulaDoMosaico(index: number, total: number) {
  if (index === 0) return "col-span-2 row-span-2 bg-salvia-suave";
  if (total === 2) return "col-span-2 row-span-2";
  if (total === 3) return "col-span-2";
  if (total === 4 && index === 3) return "col-span-2";
  return "";
}

function MosaicoDoComputador({ images, aoAmpliar }: { images: string[]; aoAmpliar: (i: number) => void }) {
  const mosaic = images.slice(0, 5);
  return (
    <div className="hidden md:grid md:auto-rows-[200px] md:grid-cols-4 md:gap-2 md:overflow-hidden md:rounded-[16px]">
      {mosaic.map((img, i) => (
        <div key={i} className={cn("relative bg-areia", celulaDoMosaico(i, mosaic.length))}>
          <button type="button" onClick={() => aoAmpliar(i)} aria-label={`Ampliar foto ${i + 1} de ${images.length}`} className="absolute inset-0 block cursor-zoom-in">
            <ImagemDaPessoa
              src={img}
              alt=""
              sizes={i === 0 ? "(min-width: 1200px) 600px, 50vw" : "(min-width: 1200px) 300px, 25vw"}
              className="object-cover transition-transform duration-500 hover:scale-[1.02]"
              priority={i === 0}
            />
          </button>
          {i === mosaic.length - 1 && images.length > 1 ? (
            <button type="button" onClick={() => aoAmpliar(0)} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm, "absolute bottom-3 right-3")}>
              Ver as {images.length} fotos
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

interface PropriedadesDoCelular {
  images: string[];
  companyName: string;
  ativa: number;
  aoEscolher: (i: number) => void;
}

function FotosDoCelular({ images, companyName, ativa, aoEscolher }: PropriedadesDoCelular) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-salvia-suave">
        <ImagemDaPessoa src={images[ativa] ?? images[0]} alt={`Foto ${ativa + 1} de ${companyName}`} sizes="100vw" className="object-cover" priority />
        {images.length > 1 ? (
          <span className="absolute bottom-3 right-3 rounded-full bg-papel px-3 py-1 text-sm font-semibold text-tinta">
            {ativa + 1} / {images.length}
          </span>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => aoEscolher(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-pressed={ativa === i}
              className={cn("relative size-[60px] shrink-0 cursor-pointer overflow-hidden rounded-[12px] border-2 bg-areia", ativa === i ? "border-ameixa" : "border-transparent opacity-80")}
            >
              <ImagemDaPessoa src={img} alt="" sizes="60px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface PropriedadesDaGaleria extends Omit<PropriedadesDoCelular, "aoEscolher"> {
  aoEscolher: (i: number) => void;
  aoAmpliar: (i: number) => void;
}

/** Fotos: mosaico no computador, foto grande com miniaturas no celular. */
export function GaleriaDeFotos({ images, companyName, ativa, aoEscolher, aoAmpliar }: PropriedadesDaGaleria) {
  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/6] w-full flex-col items-center justify-center gap-1 rounded-[16px] bg-salvia-suave text-sm text-tinta-suave">
        <Camera className="size-8" aria-hidden="true" />
        Este fornecedor ainda não enviou fotos.
      </div>
    );
  }
  return (
    <section aria-label="Fotos do trabalho">
      <MosaicoDoComputador images={images} aoAmpliar={aoAmpliar} />
      <FotosDoCelular images={images} companyName={companyName} ativa={ativa} aoEscolher={aoEscolher} />
    </section>
  );
}

interface PropriedadesDaJanela {
  images: string[];
  companyName: string;
  aberta: number;
  aoMudar: (indice: number) => void;
}

/** Fotos ampliadas (-1 = fechada). */
export function JanelaDeFotos({ images, companyName, aberta, aoMudar }: PropriedadesDaJanela) {
  const passar = (delta: number) => aoMudar(aberta < 0 ? aberta : (aberta + delta + images.length) % images.length);
  return (
    <Dialogo open={aberta >= 0} onOpenChange={(open) => !open && aoMudar(-1)}>
      <ConteudoDoDialogo className="max-w-[min(960px,calc(100%-1rem))] gap-3 rounded-[16px] bg-papel p-3 sm:max-w-[min(960px,calc(100%-2rem))]">
        <TituloDoDialogo className="sr-only">Fotos de {companyName}</TituloDoDialogo>
        <DescricaoDoDialogo className="sr-only">Use as setas para ver as outras fotos.</DescricaoDoDialogo>
        {aberta >= 0 ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[12px] bg-areia">
            <ImagemDaPessoa src={images[aberta]} alt={`Foto ${aberta + 1} de ${images.length}`} sizes="960px" className="object-contain" />
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => passar(-1)} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm)} aria-label="Foto anterior">
            <ChevronLeft className="size-4" aria-hidden="true" />
            Anterior
          </button>
          <span className="text-sm font-semibold text-tinta-suave">
            {aberta + 1} / {images.length}
          </span>
          <button type="button" onClick={() => passar(1)} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm)} aria-label="Próxima foto">
            Próxima
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </ConteudoDoDialogo>
    </Dialogo>
  );
}
