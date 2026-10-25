"use client";

import { Download } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { cn } from "@/lib/utils";

/** Abre a impressão do navegador, onde dá para salvar o recibo em PDF. */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={cn(estiloDoBotao.primary, "min-h-11")}>
      <Download aria-hidden="true" className="size-4" />
      Baixar PDF
    </button>
  );
}
