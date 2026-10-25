// Faixa "Em destaque": os fornecedores do plano Master.
import Link from "next/link";
import { Building2, Sparkles, Star } from "lucide-react";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import type { FornecedorPublico } from "./constantes";

function CartaoEmDestaque({ fornecedor }: { fornecedor: FornecedorPublico }) {
  return (
    <li className="w-64 shrink-0 snap-start">
      <Link href={`/fornecedores/${fornecedor.id}`} className="group flex flex-col gap-3 rounded-[16px] border border-linha bg-papel p-3 shadow-aceito-1 transition-colors hover:border-ameixa">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[12px] bg-salvia-suave">
          {fornecedor.coverUrl ? (
            <ImagemDaPessoa src={fornecedor.coverUrl} alt="" sizes="256px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-tinta-suave"><Building2 className="size-8" aria-hidden="true" /></div>
          )}
        </div>
        <div className="flex flex-col gap-1 px-1 pb-1">
          <p className="line-clamp-1 font-display text-lg font-medium leading-6 text-tinta group-hover:text-ameixa">{fornecedor.companyName}</p>
          <p className="flex items-center justify-between gap-2 text-sm text-tinta-suave">
            <span>{fornecedor.category}</span>
            {fornecedor.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1 font-semibold text-tinta">
                <Star className="size-4 fill-champanhe text-champanhe" aria-hidden="true" />
                {fornecedor.rating.toFixed(1)}
                <span className="sr-only">de 5 estrelas</span>
              </span>
            ) : null}
          </p>
        </div>
      </Link>
    </li>
  );
}

export function Destaques({ fornecedores }: { fornecedores: FornecedorPublico[] }) {
  if (fornecedores.length === 0) return null;
  return (
    <section aria-labelledby="em-destaque" className="flex flex-col gap-3">
      <h2 id="em-destaque" className="flex items-center gap-2 font-display text-[22px] font-medium leading-7 text-tinta">
        <Sparkles className="size-5 text-ameixa" aria-hidden="true" />
        Em destaque
      </h2>
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6">
        {fornecedores.map((f) => <CartaoEmDestaque key={f.id} fornecedor={f} />)}
      </ul>
    </section>
  );
}
