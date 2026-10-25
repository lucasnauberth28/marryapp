import { Check } from "lucide-react";
import { MODELOS_DO_SITE, modeloDoSite, type ModeloDoSite } from "@/components/public/site-do-casamento/modelos/catalogo";
import { cn } from "@/lib/utils";
import { EsbocoDoModelo } from "./esboco-do-modelo";
import type { EditorDoSite } from "./use-configuracoes-do-site";

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
        <EsbocoDoModelo modelo={modelo} />
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
