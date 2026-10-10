import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

interface StatusScreenProps {
  eyebrow: string;
  title: string;
  description: string;
  actions: ReactNode;
  /** Sinal dentro do arco: "?" para página não encontrada, "!" para erro. */
  glyph?: string;
}

// Tela cheia para erros e páginas não encontradas: arco champanhe com o sinal, no tema do app.
export function StatusScreen({ eyebrow, title, description, actions, glyph = "?" }: StatusScreenProps) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-linho text-tinta">
      <header className="border-b border-linha px-4 py-4 sm:px-6">
        <Link href="/" aria-label="Aceito, início" className="inline-flex rounded-[12px] transition-opacity hover:opacity-80">
          <Logo height={28} />
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center gap-5 px-4 py-12 text-center sm:px-6 sm:py-16">
        <div aria-hidden="true" className="arch flex h-[160px] w-[120px] items-center justify-center border border-champanhe">
          <span className="font-display text-[64px] italic leading-none text-ameixa">{glyph}</span>
        </div>
        <p className="text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">{eyebrow}</p>
        <h1 className="font-display text-[34px] font-normal leading-10 tracking-[-0.015em] text-balance text-tinta sm:text-[40px] sm:leading-[46px]">
          {title}
        </h1>
        <p className="text-tinta-suave">{description}</p>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3">{actions}</div>
      </main>
    </div>
  );
}
