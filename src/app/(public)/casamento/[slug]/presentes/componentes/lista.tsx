import Link from "next/link";
import { Check, Gift as GiftIcon, Search } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import { formatarReaisEnxuto } from "@/lib/formatacao/dinheiro";
import type { PresenteLocal as Gift } from "@/types/local";
import { cn } from "@/lib/utils";

export type Ordenacao = "default" | "asc" | "desc";

const classeDoCampo =
  "min-h-11 rounded-[12px] border border-linha-forte bg-papel text-base leading-6 text-tinta transition-[border-color,box-shadow] duration-200 placeholder:text-tinta-suave/80 hover:border-tinta-suave focus:border-ameixa focus:shadow-[0_0_0_3px_var(--color-ameixa-suave)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa";

/** Filtra pelo texto (título ou descrição) e ordena pelo valor. */
export function filtrarEOrdenar(gifts: Gift[], search: string, sortBy: Ordenacao) {
  const q = search.trim().toLowerCase();
  return gifts
    .filter((g) => g.title.toLowerCase().includes(q) || (g.description ? g.description.toLowerCase().includes(q) : false))
    .sort((a, b) => (sortBy === "asc" ? a.amount - b.amount : sortBy === "desc" ? b.amount - a.amount : 0));
}

export function SemPresentes() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[16px] border border-linha bg-papel px-6 py-16 text-center">
      <GiftIcon aria-hidden="true" className="mb-1 size-10 text-tinta-suave" strokeWidth={1.5} />
      <p className="font-semibold text-tinta">A lista ainda está sendo preparada.</p>
      <p className="max-w-[40ch] text-sm text-tinta-suave">Os noivos ainda não cadastraram presentes. Volte em alguns dias.</p>
    </div>
  );
}

interface PropriedadesDaBarra {
  search: string;
  aoBuscar: (v: string) => void;
  sortBy: Ordenacao;
  aoOrdenar: (v: Ordenacao) => void;
}

export function BarraDeBuscaEOrdem({ search, aoBuscar, sortBy, aoOrdenar }: PropriedadesDaBarra) {
  return (
    <div className="flex flex-col gap-3 pb-6 pt-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative sm:w-[360px]">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-tinta-suave" strokeWidth={1.6} />
        <input type="search" aria-label="Buscar presente por nome" placeholder="Buscar presente por nome" value={search} onChange={(e) => aoBuscar(e.target.value)} className={cn(classeDoCampo, "w-full pl-10 pr-4")} />
      </div>
      <select aria-label="Ordenar" value={sortBy} onChange={(e) => aoOrdenar(e.target.value as Ordenacao)} className={cn(classeDoCampo, "cursor-pointer px-4 sm:w-auto")}>
        <option value="default">Mais recentes</option>
        <option value="asc">Menor valor</option>
        <option value="desc">Maior valor</option>
      </select>
    </div>
  );
}

function CartaoDoPresente({ gift }: { gift: Gift }) {
  return (
    <article className="flex h-full flex-col gap-2">
      <div className="relative aspect-square overflow-hidden rounded-[16px] bg-areia">
        {gift.imageUrl ? (
          <ImagemDaPessoa src={gift.imageUrl} alt="" sizes="(min-width: 1024px) 262px, (min-width: 768px) 33vw, 50vw" className="object-cover" />
        ) : (
          <div aria-hidden="true" className="grid h-full place-items-center text-tinta-suave">
            <GiftIcon className="size-8" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <h2 className="text-[15px] font-semibold leading-5 text-tinta sm:text-base sm:leading-6">{gift.title}</h2>
      <p className="text-sm text-tinta-suave sm:text-base">{formatarReaisEnxuto(gift.amount)}</p>
      {gift.description ? <p className="line-clamp-2 text-sm leading-5 text-tinta-suave">{gift.description}</p> : null}
      <div className="mt-auto pt-1">
        {gift.isPurchased ? (
          <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-sucesso-suave px-3 text-sm font-semibold text-sucesso">
            <Check aria-hidden="true" className="size-4" strokeWidth={2.25} />
            Já foi presenteado
          </span>
        ) : (
          <Link href={`/checkout/${gift.id}`} aria-label={`Presentear: ${gift.title}`} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm, estiloDoBotao.block)}>
            Presentear
          </Link>
        )}
      </div>
    </article>
  );
}

export function GradeDePresentes({ gifts }: { gifts: Gift[] }) {
  if (gifts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-[16px] border border-linha bg-papel px-6 py-14 text-center">
        <p className="font-semibold text-tinta">Nenhum presente encontrado.</p>
        <p className="text-sm text-tinta-suave">Tente buscar por outro termo.</p>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {gifts.map((gift) => (
        <li key={gift.id}>
          <CartaoDoPresente gift={gift} />
        </li>
      ))}
    </ul>
  );
}
