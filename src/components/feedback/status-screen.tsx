import type { ReactNode } from "react";
import { WeddingRingsIcon } from "@/components/icons/wedding-rings";

interface StatusScreenProps {
  eyebrow: string;
  title: string;
  description: string;
  actions: ReactNode;
}

// Tela cheia para erros e páginas não encontradas, no tema do app.
export function StatusScreen({ eyebrow, title, description, actions }: StatusScreenProps) {
  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center bg-ivory px-4 py-16">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/20 bg-brand-50 text-brand">
          <WeddingRingsIcon className="h-7 w-7" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>
        <h1 className="font-display text-[32px] leading-[38px] tracking-[-0.01em] text-tinta text-balance md:text-[40px] md:leading-[46px]">{title}</h1>
        <p className="text-sm text-tinta-suave">{description}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">{actions}</div>
      </div>
    </div>
  );
}
