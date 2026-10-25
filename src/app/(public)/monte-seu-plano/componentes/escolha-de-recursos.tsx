import { Check } from "lucide-react";
import { estiloDoSobretituloDaLanding } from "@/components/landing/styles";
import { formatarReaisInteiros } from "@/lib/formatacao/dinheiro";
import type { ModuloDePreco } from "@/lib/pricing-modules";
import { cn } from "@/lib/utils";

function CartaoDeRecurso({ mod, selecionado, aoAlternar }: { mod: ModuloDePreco; selecionado: boolean; aoAlternar: () => void }) {
  const inputId = `modulo-${mod.id}`;
  return (
    <li className="flex">
      <label
        htmlFor={inputId}
        className={cn(
          "relative flex w-full cursor-pointer gap-4 rounded-[16px] border bg-papel p-5 shadow-aceito-1 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-ameixa",
          selecionado ? "border-2 border-ameixa p-[19px]" : "border-linha hover:border-linha-forte",
        )}
      >
        <input id={inputId} type="checkbox" checked={selecionado} onChange={aoAlternar} className="peer sr-only" />
        <span aria-hidden="true" className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-[6px] border-2", selecionado ? "border-ameixa bg-ameixa text-on-ameixa" : "border-linha-forte bg-papel")}>
          {selecionado ? <Check className="size-4" strokeWidth={3} /> : null}
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className={estiloDoSobretituloDaLanding}>{mod.category}</span>
          <span className="text-lg font-semibold leading-6">{mod.name}</span>
          <span className="text-base leading-6 text-tinta-suave">{mod.description}</span>
          <span className="mt-1 font-semibold">
            {mod.isIncludedInBase ? "Grátis" : formatarReaisInteiros(mod.price)}
            <span className="font-normal text-tinta-suave"> · pagamento único</span>
          </span>
        </span>
      </label>
    </li>
  );
}

/** Recursos: cada cartão é uma caixa de seleção, que funciona com teclado e leitor de tela. */
export function EscolhaDeRecursos({ modules, selecionados, aoAlternar }: { modules: ModuloDePreco[]; selecionados: string[]; aoAlternar: (id: string) => void }) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">Recursos do plano</legend>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {modules.map((mod) => (
          <CartaoDeRecurso key={mod.id} mod={mod} selecionado={selecionados.includes(mod.id)} aoAlternar={() => aoAlternar(mod.id)} />
        ))}
      </ul>
    </fieldset>
  );
}
