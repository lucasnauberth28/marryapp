import Link from "next/link";
import { ArrowLeft, Image as ImageIcon, Share2 } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { cn } from "@/lib/utils";

interface Propriedades {
  edit: boolean;
  coupleNames: string;
  compartilhado: boolean;
  aoTrocarCenario: () => void;
  aoCompartilhar: () => void;
}

export function CabecalhoDasMesas({ edit, coupleNames, compartilhado, aoTrocarCenario, aoCompartilhar }: Propriedades) {
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave">{edit ? "Mesas" : "Mapa das mesas"}</p>
        <h1 className="font-display text-[26px] font-medium leading-8 tracking-[-0.01em] text-tinta md:text-[32px] md:leading-10">{edit ? "Mesas em 3D" : coupleNames}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {edit ? (
          <Link href="/mesas" className={cn(estiloDoBotao.secondary, "min-h-11 gap-2")}>
            <ArrowLeft aria-hidden="true" className="size-4" /> Lista de mesas
          </Link>
        ) : null}
        <button type="button" onClick={aoTrocarCenario} className={cn(estiloDoBotao.secondary, "min-h-11 gap-2")}>
          <ImageIcon aria-hidden="true" className="size-4" /> Trocar cenário
        </button>
        {edit ? (
          <button type="button" onClick={aoCompartilhar} className={cn(estiloDoBotao.primary, "min-h-11 gap-2")}>
            <Share2 aria-hidden="true" className="size-4" /> {compartilhado ? "Link compartilhado" : "Compartilhar"}
          </button>
        ) : null}
      </div>
    </header>
  );
}
