import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Etiqueta } from "@/components/casal/ui";

interface PropriedadesDaLinhaDaSecao {
  id: string;
  title: string;
  /** undefined: a seção não pode ser ocultada (capa). */
  visible?: boolean;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** Uma seção do site: linha de 48px com chip Visível/Oculta que abre os campos da seção. */
export function LinhaDaSecao({ id, title, visible, open, onToggle, children }: PropriedadesDaLinhaDaSecao) {
  return (
    <li className={`rounded-xl bg-papel ${open ? "border-2 border-ameixa" : "border border-linha"}`}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`secao-${id}`}
          onClick={onToggle}
          className="flex min-h-12 w-full cursor-pointer items-center gap-2 rounded-xl px-3 text-left"
        >
          <span className="flex-1 font-semibold text-tinta">{title}</span>
          {visible === undefined ? null : visible ? (
            <Etiqueta tone="sucesso">Visível</Etiqueta>
          ) : (
            <Etiqueta tone="neutro">Oculta</Etiqueta>
          )}
          <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-tinta-suave transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </h3>
      {open && (
        <div id={`secao-${id}`} className="flex flex-col gap-5 px-3 pb-4 pt-3">
          {children}
        </div>
      )}
    </li>
  );
}
