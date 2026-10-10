"use client";

import { usePathname } from "next/navigation";
import { Info } from "lucide-react";
import { showsMainWeddingNote } from "@/lib/account-label";

/**
 * Aviso discreto para a administração: as telas do casal mostram o casamento principal.
 * Aparece só nas páginas que falam do casamento (não nas de administração e de conta).
 */
export function MainWeddingNote({ coupleNames }: { coupleNames: string }) {
  const pathname = usePathname();
  if (!showsMainWeddingNote(pathname)) return null;
  return (
    <p className="mb-4 flex items-start gap-2 text-sm leading-5 text-tinta-suave">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        Você está vendo o casamento principal: <span className="font-semibold text-tinta">{coupleNames}</span>
      </span>
    </p>
  );
}
