import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { estiloDoCartao } from "@/components/casal/ui";

export function ColunaQueFalta({ categorias }: { categorias: string[] }) {
  return (
    <section aria-labelledby="falta-titulo" className="flex flex-col gap-2 rounded-2xl bg-areia p-3">
      <h2 id="falta-titulo" className="mx-2 mb-1 mt-1 flex justify-between text-sm font-semibold text-tinta">
        Ainda falta escolher <span className="text-tinta-suave">{categorias.length}</span>
      </h2>
      {categorias.length === 0 ? (
        <p className={`${estiloDoCartao} p-4 text-[15px] text-tinta-suave`}>Vocês já têm fornecedor em todas as categorias mais comuns.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {categorias.map((c) => (
            <li key={c}>
              <Link href="/fornecedores" className={`${estiloDoCartao} flex min-h-12 items-center justify-between p-3.5 text-tinta no-underline hover:border-ameixa`}>
                <span>{c}</span>
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
