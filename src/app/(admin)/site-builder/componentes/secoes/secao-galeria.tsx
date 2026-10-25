import { useRef } from "react";
import { ArrowLeft, ArrowRight, Trash2, Upload } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { MAXIMO_DE_FOTOS_DA_GALERIA } from "@/components/public/site-do-casamento/modelos/catalogo";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import { InterruptorDeVisibilidade } from "../interruptor-de-visibilidade";
import type { ChaveDaConfiguracao } from "../tipos";
import type { EditorDoSite } from "../use-configuracoes-do-site";
import type { useGaleria } from "../use-galeria";

type Galeria = ReturnType<typeof useGaleria>;

function FotoDaGaleria({ src, indice, total, galeria }: { src: string; indice: number; total: number; galeria: Galeria }) {
  const botao = "grid size-9 place-items-center rounded-full bg-papel text-tinta shadow-[var(--shadow-aceito-1)] disabled:opacity-40";
  return (
    <li className="relative aspect-[4/5] overflow-hidden rounded-lg bg-areia">
      <ImagemDaPessoa src={src} alt={`Foto ${indice + 1} da galeria`} sizes="120px" className="object-cover" />
      <span className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
        <button type="button" className={botao} aria-label={`Mover a foto ${indice + 1} para antes`} disabled={indice === 0} onClick={() => galeria.mover(indice, -1)}><ArrowLeft className="size-4" aria-hidden="true" /></button>
        <button type="button" className={botao} aria-label={`Remover a foto ${indice + 1}`} onClick={() => galeria.remover(indice)}><Trash2 className="size-4" aria-hidden="true" /></button>
        <button type="button" className={botao} aria-label={`Mover a foto ${indice + 1} para depois`} disabled={indice === total - 1} onClick={() => galeria.mover(indice, 1)}><ArrowRight className="size-4" aria-hidden="true" /></button>
      </span>
    </li>
  );
}

export function SecaoDaGaleria({ chave, descricao, site, galeria }: { chave: ChaveDaConfiguracao; descricao?: string; site: EditorDoSite; galeria: Galeria }) {
  const entrada = useRef<HTMLInputElement>(null);
  return (
    <>
      <InterruptorDeVisibilidade chave={chave} descricao={descricao} site={site} />
      {galeria.fotos.length > 0 && (
        <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
          {galeria.fotos.map((src, i) => <FotoDaGaleria key={src} src={src} indice={i} total={galeria.fotos.length} galeria={galeria} />)}
        </ul>
      )}
      <input ref={entrada} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" aria-label="Enviar fotos da galeria" onChange={(e) => { galeria.adicionar(e.target.files); e.target.value = ""; }} />
      <BotaoComCarregamento className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm} w-fit`} loading={galeria.enviando} disabled={galeria.cheia} onClick={() => entrada.current?.click()}>
        <Upload className="size-4" aria-hidden="true" />
        Adicionar fotos
      </BotaoComCarregamento>
      <p className="text-sm text-tinta-suave">{galeria.fotos.length} de {MAXIMO_DE_FOTOS_DA_GALERIA} fotos. A primeira aparece maior. Sem fotos, a seção não aparece no site.</p>
    </>
  );
}
