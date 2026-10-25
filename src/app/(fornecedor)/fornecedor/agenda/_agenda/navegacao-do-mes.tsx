import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LinkPendente } from "@/components/feedback/link-pending";
import { cn } from "@/lib/utils";

const ESTILO_DO_BOTAO_DE_NAVEGACAO = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-[15px] font-semibold transition-colors";

export function parametroDoMes(year: number, month: number) {
  const d = new Date(Date.UTC(year, month, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function NavegacaoDoMes({ year, month, isCurrentMonth }: { year: number; month: number; isCurrentMonth: boolean }) {
  return (
    <nav aria-label="Navegar entre meses" className="flex items-center gap-1">
      <Link href={`/fornecedor/agenda?mes=${parametroDoMes(year, month - 1)}`} scroll={false} aria-label="Mês anterior" className={cn(ESTILO_DO_BOTAO_DE_NAVEGACAO, "text-tinta-suave hover:bg-areia hover:text-tinta")}>
        <ChevronLeft aria-hidden="true" className="size-5" />
        <LinkPendente label="Carregando o mês" />
      </Link>
      <Link href="/fornecedor/agenda" scroll={false} aria-current={isCurrentMonth ? "date" : undefined} className={cn(ESTILO_DO_BOTAO_DE_NAVEGACAO, "border border-linha-forte bg-papel px-4 text-sm text-tinta hover:bg-areia")}>
        Hoje
        <LinkPendente label="Carregando o mês" />
      </Link>
      <Link href={`/fornecedor/agenda?mes=${parametroDoMes(year, month + 1)}`} scroll={false} aria-label="Próximo mês" className={cn(ESTILO_DO_BOTAO_DE_NAVEGACAO, "text-tinta-suave hover:bg-areia hover:text-tinta")}>
        <ChevronRight aria-hidden="true" className="size-5" />
        <LinkPendente label="Carregando o mês" />
      </Link>
    </nav>
  );
}
