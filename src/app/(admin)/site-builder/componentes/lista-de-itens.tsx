import { Trash2 } from "lucide-react";
import { Botao } from "@/components/ui/button";

interface PropriedadesDaListaDeItens {
  title: string;
  empty: string;
  items: { id: string; eyebrow?: string | null; title: string; text?: string | null }[];
  onDelete: (item: { id: string; title: string }) => void;
}

export function ListaDeItens({ title, empty, items, onDelete }: PropriedadesDaListaDeItens) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-sm font-semibold text-tinta">{title}</h4>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-linha-forte bg-linho p-3 text-sm text-tinta-suave">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-linha bg-papel p-3">
              <div className="min-w-0">
                {item.eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">{item.eyebrow}</p>}
                <p className="truncate font-semibold text-tinta">{item.title}</p>
                {item.text && <p className="line-clamp-2 text-sm text-tinta-suave">{item.text}</p>}
              </div>
              <Botao
                aria-label={`Remover ${item.title}`}
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item)}
                className="size-11 shrink-0 rounded-xl text-tinta-suave hover:bg-perigo-suave hover:text-perigo"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Botao>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
