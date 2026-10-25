import { useRef } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { EsqueletoDeImagem } from "@/components/skeletons";
import { cn } from "@/lib/utils";
import { MAXIMO_DE_IMAGENS_NA_GALERIA } from "../../../_lib/vendor-panel";
import { TIPOS_ACEITOS } from "./comprimir-imagem";
import { ESTILO_DA_DICA, ESTILO_DO_BOTAO_DE_ICONE, ESTILO_DO_BOTAO_SECUNDARIO } from "./estilos";
import type { Midias } from "./use-midias";

function FotoDaGaleria({ url, i, ultima, m }: { url: string; i: number; ultima: boolean; m: Midias }) {
  const ocupado = m.busy !== null;
  const mover = (direction: "up" | "down") => m.run(`move-${i}`, async () => ({ action: "move-gallery", index: i, direction }), "Ordem atualizada.");
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-linha bg-linho p-2">
      <div className={cn("relative aspect-[4/3] overflow-hidden rounded-lg bg-areia", i === 0 && "outline-2 outline-offset-[3px] outline-ameixa")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Foto ${i + 1} da galeria`} className="size-full object-cover" />
        <span className="absolute top-1.5 left-1.5 rounded-full bg-papel/95 px-2 py-0.5 text-xs font-semibold">{i + 1}</span>
      </div>
      <div className="flex justify-between gap-1">
        <div className="flex gap-1">
          <button type="button" disabled={ocupado || i === 0} onClick={() => mover("up")} aria-label={`Mover foto ${i + 1} para antes`} className={ESTILO_DO_BOTAO_DE_ICONE}>
            <ArrowUp aria-hidden="true" className="size-[18px] md:-rotate-90" />
          </button>
          <button type="button" disabled={ocupado || ultima} onClick={() => mover("down")} aria-label={`Mover foto ${i + 1} para depois`} className={ESTILO_DO_BOTAO_DE_ICONE}>
            <ArrowDown aria-hidden="true" className="size-[18px] md:-rotate-90" />
          </button>
        </div>
        <button type="button" disabled={ocupado} onClick={() => m.run(`remove-${i}`, async () => ({ action: "remove-gallery", index: i }), "Foto removida.")} aria-label={`Remover foto ${i + 1}`} className={ESTILO_DO_BOTAO_DE_ICONE}>
          {m.busy === `remove-${i}` ? <Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> : <Trash2 aria-hidden="true" className="size-[18px]" />}
        </button>
      </div>
    </li>
  );
}

export function Galeria({ m }: { m: Midias }) {
  const entrada = useRef<HTMLInputElement>(null);
  const cheia = m.media.gallery.length >= MAXIMO_DE_IMAGENS_NA_GALERIA;
  return (
    <div className="flex flex-col gap-3 border-t border-linha pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-tinta">
            Galeria <span className="font-normal text-tinta-suave">({m.media.gallery.length} de {MAXIMO_DE_IMAGENS_NA_GALERIA})</span>
          </p>
          <p className={ESTILO_DA_DICA}>A primeira foto abre o portfólio no seu perfil. Use as setas para mudar a ordem.</p>
        </div>
        <input ref={entrada} type="file" accept={TIPOS_ACEITOS} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={m.aoEscolher("gallery")} />
        <button type="button" disabled={m.busy !== null || cheia} onClick={() => entrada.current?.click()} className={ESTILO_DO_BOTAO_SECUNDARIO}>
          {m.busy === "gallery" ? <Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> : <ImagePlus aria-hidden="true" className="size-[18px]" />}
          {cheia ? "Galeria completa" : "Adicionar foto"}
        </button>
      </div>
      {m.media.gallery.length === 0 ? (
        <p className="rounded-xl border border-dashed border-linha-forte px-4 py-8 text-center text-tinta-suave">Nenhuma foto na galeria ainda. Casais pedem mais orçamento a perfis com fotos reais de casamentos.</p>
      ) : (
        <ol className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {m.media.gallery.map((url, i) => (
            <FotoDaGaleria key={`${i}-${url.slice(-24)}`} url={url} i={i} ultima={i === m.media.gallery.length - 1} m={m} />
          ))}
          {m.busy === "gallery" ? (
            <li aria-hidden="true" className="flex flex-col gap-2 rounded-xl border border-linha bg-linho p-2">
              <EsqueletoDeImagem ratio="4/3" className="rounded-lg" />
              <div className="h-11" />
            </li>
          ) : null}
        </ol>
      )}
    </div>
  );
}
