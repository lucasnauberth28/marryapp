import Link from "next/link";
import { estiloDoBotao } from "@/components/landing/styles";
import type { ResultadoDaAjuda } from "@/lib/liz/help-search";
import { rotuloDoPlanoNecessario } from "@/lib/wedding-plan-modules";

export function CorpoDoArtigo({ hit, canOpenPlans, onNavigate }: { hit: ResultadoDaAjuda | undefined; canOpenPlans: boolean; onNavigate: () => void }) {
  if (!hit) return <p>Não achei essa dúvida agora.</p>;
  const { article, locked } = hit;
  return (
    <div className="flex flex-col gap-3">
      <p>{article.answer}</p>
      {locked && article.planModule ? <p className="rounded-lg bg-aviso-suave px-3 py-2 text-sm leading-5 text-aviso">Este recurso é do plano {rotuloDoPlanoNecessario(article.planModule)} ou de um plano adaptado.</p> : null}
      <ol className="flex list-decimal flex-col gap-1.5 pl-5 marker:font-semibold marker:text-tinta-suave">
        {article.steps.map((step) => (
          <li key={step} className="pl-1">
            {step}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <Link href={article.action.href} onClick={onNavigate} className={`${estiloDoBotao.primary} ${estiloDoBotao.sm}`}>
          {article.action.label}
        </Link>
        {locked && canOpenPlans ? (
          <Link href="/plano" onClick={onNavigate} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
            Ver Plano e pagamentos
          </Link>
        ) : null}
      </div>
    </div>
  );
}
