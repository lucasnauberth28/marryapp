"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { btn } from "@/components/landing/styles";
import { openLiz } from "@/lib/liz/events";
import type { LizTipPose } from "@/lib/liz/pose";
import { LizIllustration } from "@/components/liz/liz-illustration";

/**
 * Cartão de sugestão da Liz: uma dica por regras (sem IA, sem chat) com uma ação principal.
 * O texto segue "situação observada + motivo + ação": a Liz orienta, quem decide e executa é o casal.
 * "Agora não" esconde a dica por alguns dias, lembrando no navegador (localStorage).
 * Quem usa decide a dica com dados reais do casamento e passa `id` estável por tipo de dica,
 * e a pose da Liz pelo motivo (lizTipPose): sugerindo, ou atenção quando o motivo é prazo.
 */

const DIAS_SEM_INSISTIR = 3;
const MS_DIA = 86_400_000;
const chave = (id: string) => `aceito:madrinha:${id}`;

const ouvintes = new Set<() => void>();
function assinar(cb: () => void) {
  ouvintes.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    ouvintes.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** Verdadeiro enquanto a dica está "adiada". Sem localStorage (modo privado), a dica fica visível. */
function adiada(id: string): boolean {
  try {
    return Number(localStorage.getItem(chave(id))) > Date.now();
  } catch {
    return false;
  }
}

function adiar(id: string) {
  try {
    localStorage.setItem(chave(id), String(Date.now() + DIAS_SEM_INSISTIR * MS_DIA));
  } catch {
    // sem localStorage: a dica some só até recarregar a página
  }
  ouvintes.forEach((cb) => cb());
}

interface MadrinhaCardProps {
  /** Id estável da dica (ex.: "rsvp-sem-resposta"): é o que "Agora não" lembra. */
  id: string;
  /** O texto da sugestão, já com os números reais (situação e motivo). */
  text: ReactNode;
  actionLabel: string;
  actionHref: string;
  /** Pose da Liz conforme o motivo da dica (lib/liz/pose: lizTipPose). */
  pose?: LizTipPose;
  className?: string;
}

export function MadrinhaCard({ id, text, actionLabel, actionHref, pose = "sugerindo", className = "" }: MadrinhaCardProps) {
  // No servidor mostra a dica; no navegador esconde se o casal já disse "Agora não".
  const escondida = useSyncExternalStore(
    assinar,
    () => adiada(id),
    () => false,
  );
  if (escondida) return null;

  return (
    <aside
      aria-label="Sugestão da Liz"
      className={`grid grid-cols-[auto_1fr] gap-x-3 gap-y-2.5 rounded-2xl border border-linha bg-papel p-4 sm:gap-x-4 sm:gap-y-3 sm:p-6 ${className}`}
    >
      {/* Decorativa: o título ao lado já nomeia a Liz. Surge de leve (some com movimento reduzido). */}
      <LizIllustration
        pose={pose}
        height={112}
        decorative
        className="row-span-2 h-[100px] w-auto self-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 sm:h-28"
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-5 text-tinta">A Liz sugere o próximo passo</p>
        <p className="mt-1 text-[15px] leading-6 text-tinta sm:text-base">{text}</p>
      </div>
      <div className="col-start-2 flex flex-wrap gap-2">
        <Link href={actionHref} className={`${btn.primary} ${btn.sm}`}>
          {actionLabel}
        </Link>
        <button type="button" onClick={() => adiar(id)} className={`${btn.quiet} ${btn.sm}`}>
          Agora não
        </button>
        <button type="button" onClick={openLiz} className={`${btn.quiet} ${btn.sm}`}>
          Falar com a Liz
        </button>
      </div>
    </aside>
  );
}
