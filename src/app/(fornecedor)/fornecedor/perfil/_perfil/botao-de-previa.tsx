import Link from "next/link";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { ESTILO_DO_BOTAO } from "./estilos";

export function BotaoDePrevia({ vendorId }: { vendorId: string }) {
  return (
    <Link href={`/fornecedores/${vendorId}`} target="_blank" rel="noopener" className={cn(ESTILO_DO_BOTAO, "px-5 border border-linha-forte bg-papel text-tinta hover:bg-areia")}>
      <Eye aria-hidden="true" className="size-[18px]" />
      Pré-visualizar
      <span className="sr-only">(abre em nova aba)</span>
    </Link>
  );
}
