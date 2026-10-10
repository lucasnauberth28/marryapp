"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { Flower2 } from "lucide-react";
import { btn } from "@/components/landing/styles";

/**
 * Cartão de sugestão da Madrinha: uma dica por regras (sem IA, sem chat) com uma ação principal.
 * "Agora não" esconde a dica por alguns dias, lembrando no navegador (localStorage).
 * Quem usa decide a dica com dados reais do casamento e passa `id` estável por tipo de dica.
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
  /** Id estável da dica (ex.: "rsvp-pendentes"): é o que "Agora não" lembra. */
  id: string;
  /** O texto da sugestão, já com os números reais. */
  text: ReactNode;
  actionLabel: string;
  actionHref: string;
  className?: string;
}

export function MadrinhaCard({ id, text, actionLabel, actionHref, className = "" }: MadrinhaCardProps) {
  // No servidor mostra a dica; no navegador esconde se o casal já disse "Agora não".
  const escondida = useSyncExternalStore(
    assinar,
    () => adiada(id),
    () => false,
  );
  if (escondida) return null;

  return (
    <aside
      aria-label="Sugestão da Madrinha"
      className={`grid grid-cols-[auto_1fr] gap-x-3 gap-y-2.5 rounded-2xl border border-linha bg-papel p-4 sm:gap-x-4 sm:gap-y-3 sm:p-6 ${className}`}
    >
      <span
        aria-hidden="true"
        className="grid h-[52px] w-10 place-items-center rounded-t-full rounded-b-md bg-salvia-suave text-salvia"
      >
        <Flower2 className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-5 text-tinta">
          Madrinha <span className="hidden font-normal text-tinta-suave sm:inline">· sua assistente</span>
        </p>
        <p className="mt-1 text-[15px] leading-6 text-tinta sm:text-base">{text}</p>
      </div>
      <div className="col-start-2 flex flex-wrap gap-2">
        <Link href={actionHref} className={`${btn.primary} ${btn.sm}`}>
          {actionLabel}
        </Link>
        <button type="button" onClick={() => adiar(id)} className={`${btn.quiet} ${btn.sm}`}>
          Agora não
        </button>
      </div>
    </aside>
  );
}
