"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { btn } from "@/components/landing/styles";
import { requiredPlanLabel } from "@/lib/wedding-plan-modules";
import type { HelpHit } from "@/lib/liz/help-search";

/** Um artigo do guia: a pergunta abre a resposta curta, os passos numerados e o botão "Ir para ...". */
export function HelpItem({
  hit,
  controlId,
  open,
  onToggle,
  onNavigate,
  canOpenPlans,
}: {
  hit: HelpHit;
  /** Id único do conteúdo (a mesma pergunta pode aparecer na busca e em Dúvidas comuns). */
  controlId: string;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  /** O perfil abre Plano e pagamentos: mostra o atalho quando o recurso é de outro plano. */
  canOpenPlans: boolean;
}) {
  const { article, locked } = hit;
  return (
    <li className="rounded-xl border border-linha bg-papel">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={controlId}
        onClick={onToggle}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-[15px] font-semibold leading-5 text-tinta hover:bg-ameixa-suave"
      >
        <span className="min-w-0">{article.title}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-tinta-suave transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div id={controlId} className="flex flex-col gap-3 px-3.5 pb-3.5 text-[15px] leading-6 text-tinta">
          <p>{article.answer}</p>
          {locked && article.planModule && (
            <p className="rounded-lg bg-aviso-suave px-3 py-2 text-sm leading-5 text-aviso">
              Este recurso é do plano {requiredPlanLabel(article.planModule)} ou de um plano adaptado.
            </p>
          )}
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 marker:font-semibold marker:text-tinta-suave">
            {article.steps.map((step) => (
              <li key={step} className="pl-1">
                {step}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Link href={article.action.href} onClick={onNavigate} className={`${btn.primary} ${btn.sm}`}>
              {article.action.label}
            </Link>
            {locked && canOpenPlans && (
              <Link href="/plano" onClick={onNavigate} className={`${btn.secondary} ${btn.sm}`}>
                Ver Plano e pagamentos
              </Link>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
