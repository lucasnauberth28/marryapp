import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AvatarComIniciais } from "@/components/plataforma/initials-avatar";
import { estiloDoBotao } from "@/components/landing/styles";
import { EsqueletoDasLinhas } from "@/components/plataforma/loading-parts";
import { RegiaoDeCarregamento } from "@/components/skeletons";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { buscarEmTudo } from "@/lib/platform/queries/suporte";

type Resultado = NonNullable<Awaited<ReturnType<typeof buscarEmTudo>>>["hits"][number];

export function EsqueletoDosResultadosDaBusca() {
  return (
    <RegiaoDeCarregamento label="a busca" className="mt-4">
      <EsqueletoDasLinhas rows={3} chip={false} />
    </RegiaoDeCarregamento>
  );
}

function IdentificacaoDoResultado({ h }: { h: Resultado }) {
  return (
    <>
      <AvatarComIniciais name={h.title} />
      <span className="min-w-0">
        <span className="block truncate font-semibold leading-5 text-tinta">{h.title}</span>
        <span className="block truncate text-sm leading-5 text-tinta-suave">{h.detail}</span>
      </span>
    </>
  );
}

function ItemDaBusca({ h }: { h: Resultado }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      {h.href ? (
        <Link href={h.href} className="flex min-w-0 flex-1 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa">
          <IdentificacaoDoResultado h={h} />
          <ChevronRight className="ml-auto size-4 shrink-0 text-tinta-suave" aria-hidden="true" />
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <IdentificacaoDoResultado h={h} />
        </div>
      )}
      {h.ticketHref && (
        <Link href={h.ticketHref} className={`${estiloDoBotao.quiet} ${estiloDoBotao.sm} shrink-0`}>
          Abrir pedido
        </Link>
      )}
    </li>
  );
}

export async function ResultadosDaBusca({ searchText, userId }: { searchText: string; userId: string }) {
  // Busca limitada por pessoa da administração: 60 por minuto
  const allowed = (await conferirLimiteDeUso({ key: `ADMIN_SEARCH:${userId}`, limit: 60, windowMs: 60_000 })).success;
  const results = allowed ? await buscarEmTudo(searchText) : null;
  return (
    <>
      {!allowed && <p className="mt-3 text-sm font-semibold text-perigo">Muitas buscas seguidas. Aguarde um minuto.</p>}
      {results && (
        <div className="mt-4" aria-live="polite">
          {results.hits.length === 0 ? (
            <p className="text-sm text-tinta-suave">Nada encontrado para &quot;{results.query}&quot;. O telefone só encontra fornecedores: o cadastro do casal não guarda telefone.</p>
          ) : (
            <ul className="divide-y divide-linha">
              {results.hits.map((h) => (
                <ItemDaBusca key={`${h.kind}-${h.id}`} h={h} />
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
