import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { card, overline, bigNumber } from "@/components/casal/ui";
import { cn } from "@/lib/utils";

/**
 * Cartão de número (as 4 caixas do topo da Visão geral, de Planos e receita, de Domínios...).
 *   <StatCard label="Receita de outubro" value="R$ 4.237" hint="até hoje, 24 pagamentos" trend={{ value: 18, label: "18%" }} href="/admin/planos" />
 *   <StatCard label="Esperando curadoria" value="6" hint="o mais antigo, há 3 dias" highlight />
 * - value: texto já formatado (use lib/platform/format). Sem dado, passe "—" e explique no hint: nunca invente número.
 * - trend: variação contra o período anterior; some se não houver base. `value` positivo = alta, negativo = queda.
 * - highlight: moldura de aviso ("precisa da sua atenção"); href: o cartão inteiro vira link.
 */
export interface StatTrend {
  value: number;
  label: string;
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  href,
  highlight,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: StatTrend | null;
  href?: string;
  highlight?: boolean;
  className?: string;
}) {
  const body = (
    <>
      <p className={overline}>{label}</p>
      <p className={cn(bigNumber, "mt-2")}>{value}</p>
      {(trend || hint) && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm leading-5 text-tinta-suave">
          {trend && (
            <span className={cn("inline-flex items-center gap-0.5 font-semibold", trend.value >= 0 ? "text-sucesso" : "text-perigo")}>
              {trend.value >= 0 ? <ArrowUpRight className="size-4" aria-hidden="true" /> : <ArrowDownRight className="size-4" aria-hidden="true" />}
              {trend.label}
              <span className="sr-only">{trend.value >= 0 ? " a mais" : " a menos"}</span>
            </span>
          )}
          {hint && <span>{hint}</span>}
        </p>
      )}
    </>
  );
  const classes = cn(card, "block p-5", highlight && "border-2 border-aviso", href && "transition-shadow hover:shadow-[var(--shadow-aceito-2)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa", className);
  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

/** Grade das caixas de número: 1 coluna no celular, 2 no tablet, `cols` (padrão 4) no computador. */
export function StatGrid({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const lg = cols === 4 ? "lg:grid-cols-4" : cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  return <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", lg)}>{children}</div>;
}
