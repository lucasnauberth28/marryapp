import { Check } from "lucide-react";
import { formatarReaisInteiros } from "@/lib/formatacao/dinheiro";
import type { ModuloDePreco } from "@/lib/pagamento/pricing-modules";
import { cn } from "@/lib/utils";
import { IconeDoRecurso } from "./icone-do-recurso";

function CartaoDeRecurso({ mod, selecionado, aoAlternar }: { mod: ModuloDePreco; selecionado: boolean; aoAlternar: () => void }) {
  const inputId = `modulo-${mod.id}`;
  return (
    <li className="flex">
      <label
        htmlFor={inputId}
        className={cn(
          "relative flex w-full cursor-pointer gap-4 rounded-[16px] border bg-papel p-5 shadow-aceito-1 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-ameixa",
          selecionado ? "border-2 border-ameixa bg-ameixa-suave p-[19px]" : "border-linha hover:border-linha-forte",
        )}
      >
        <input id={inputId} type="checkbox" checked={selecionado} onChange={aoAlternar} className="peer sr-only" />
        <span aria-hidden="true" className={cn("grid size-11 shrink-0 place-items-center rounded-xl", selecionado ? "bg-ameixa text-on-ameixa" : "bg-areia text-ameixa")}>
          {selecionado ? <Check className="size-5" strokeWidth={3} /> : <IconeDoRecurso nome={mod.iconName} className="size-5" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-base font-semibold leading-6">{mod.name}</span>
            {mod.highlightBadge ? <span className="rounded-full bg-areia px-2 py-0.5 text-xs font-semibold text-ameixa">{mod.highlightBadge}</span> : null}
          </span>
          <span className="text-sm leading-5 text-tinta-suave">{mod.description}</span>
          <span className="mt-1 font-semibold">
            {mod.isIncludedInBase ? "Grátis" : formatarReaisInteiros(mod.price)}
            <span className="font-normal text-tinta-suave"> · pagamento único</span>
          </span>
        </span>
      </label>
    </li>
  );
}

/** Categorias na ordem em que aparecem no catálogo. */
function agruparPorCategoria(modules: ModuloDePreco[]): [string, ModuloDePreco[]][] {
  const grupos = new Map<string, ModuloDePreco[]>();
  for (const m of modules) grupos.set(m.category, [...(grupos.get(m.category) ?? []), m]);
  return [...grupos];
}

/** Recursos agrupados por assunto: cada cartão é uma caixa de seleção, que funciona com teclado e leitor de tela. */
export function EscolhaDeRecursos({ modules, selecionados, aoAlternar }: { modules: ModuloDePreco[]; selecionados: string[]; aoAlternar: (id: string) => void }) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-8 border-0 p-0">
      <legend className="sr-only">Recursos do plano</legend>
      {agruparPorCategoria(modules).map(([categoria, itens]) => (
        <div key={categoria} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-tinta-suave">{categoria}</h2>
          <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {itens.map((mod) => (
              <CartaoDeRecurso key={mod.id} mod={mod} selecionado={selecionados.includes(mod.id)} aoAlternar={() => aoAlternar(mod.id)} />
            ))}
          </ul>
        </div>
      ))}
    </fieldset>
  );
}
