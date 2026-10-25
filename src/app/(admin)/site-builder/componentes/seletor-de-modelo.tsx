import { Check } from "lucide-react";
import { MODELOS_DO_SITE, modeloDoSite, type ModeloDoSite } from "@/components/public/site-do-casamento/modelos/catalogo";
import { cn } from "@/lib/utils";
import type { EditorDoSite } from "./use-configuracoes-do-site";

/** Miniatura do modelo: as cores e o desenho da capa, em escala de cartão. */
function Miniatura({ modelo }: { modelo: ModeloDoSite }) {
  const { paleta } = modelo;
  const capaCheia = modelo.capa === "tela-cheia";
  return (
    <span aria-hidden="true" className="block overflow-hidden rounded-lg border" style={{ backgroundColor: paleta.fundo, borderColor: paleta.linha }}>
      <span className="relative flex h-24 items-end gap-2 p-2" style={{ backgroundColor: capaCheia ? modelo.destaque : paleta.fundo }}>
        {capaCheia ? <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" /> : null}
        <span className={cn("relative flex min-w-0 flex-1 flex-col gap-1", modelo.alinhamento === "centro" && capaCheia && "items-center")}>
          <span className="h-2 w-16 rounded-sm" style={{ backgroundColor: capaCheia ? "#fff" : paleta.texto }} />
          <span className="h-1 w-10 rounded-sm opacity-70" style={{ backgroundColor: capaCheia ? "#fff" : paleta.apoio }} />
          <span className="mt-1 h-3 w-9 rounded-full" style={{ backgroundColor: modelo.destaque }} />
        </span>
        {modelo.capa === "dividida" ? <span className="relative h-20 w-14 rounded-t-full" style={{ backgroundColor: paleta.linha }} /> : null}
      </span>
      <span className="flex h-6 items-center gap-1 px-2" style={{ backgroundColor: paleta.faixa }}>
        {[paleta.texto, paleta.apoio, modelo.destaque].map((cor) => (
          <span key={cor} className="size-2.5 rounded-full" style={{ backgroundColor: cor }} />
        ))}
      </span>
    </span>
  );
}

function CartaoDoModelo({ modelo, escolhido, aoEscolher }: { modelo: ModeloDoSite; escolhido: boolean; aoEscolher: () => void }) {
  return (
    <li className="flex">
      <label
        className={cn(
          "flex w-full cursor-pointer flex-col gap-2 rounded-xl border bg-papel p-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ameixa",
          escolhido ? "border-2 border-ameixa p-[7px]" : "border-linha hover:border-linha-forte",
        )}
      >
        <input type="radio" name="modelo-do-site" value={modelo.id} checked={escolhido} onChange={aoEscolher} className="sr-only" />
        <Miniatura modelo={modelo} />
        <span className="flex items-center gap-1.5 px-1 text-sm font-semibold text-tinta">
          {escolhido ? <Check className="size-4 text-ameixa" aria-hidden="true" /> : null}
          {modelo.nome}
        </span>
        <span className="px-1 pb-1 text-xs leading-4 text-tinta-suave">{modelo.descricao}</span>
      </label>
    </li>
  );
}

/** Os modelos prontos: ao escolher um, o site troca de cores, letras e capa na hora (a cor de destaque volta à do modelo). */
export function SeletorDeModelo({ site }: { site: EditorDoSite }) {
  const atual = modeloDoSite(site.configuracoes.template).id;
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
      <legend className="mb-1 text-sm text-tinta-suave">Vocês só enviam as fotos e preenchem os dados. Dá para trocar de modelo quando quiserem, sem perder nada.</legend>
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0">
        {MODELOS_DO_SITE.map((modelo) => (
          <CartaoDoModelo key={modelo.id} modelo={modelo} escolhido={atual === modelo.id} aoEscolher={() => site.atualizar({ template: modelo.id, themeColor: modelo.destaque })} />
        ))}
      </ul>
    </fieldset>
  );
}
