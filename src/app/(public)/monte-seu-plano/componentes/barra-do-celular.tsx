import Link from "next/link";
import { estiloDoBotao } from "@/components/landing/styles";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { cn } from "@/lib/utils";

/** No celular o resumo fica longe dos cartões: a barra fixa mostra o total e leva ao próximo passo. */
export function BarraDoCelular({ total, quantidade, href, rotulo }: { total: number; quantidade: number; href: string; rotulo: string }) {
  const vazio = quantidade === 0;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-papel px-4 pb-[max(12px,env(safe-area-inset-bottom,0px))] pt-3 shadow-aceito-2 lg:hidden">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
        <p className="flex min-w-0 flex-col" aria-live="polite">
          <span className="text-sm text-tinta-suave">{vazio ? "Nenhum recurso" : quantidade === 1 ? "1 recurso" : `${quantidade} recursos`}</span>
          <span className="font-num text-2xl tabular-nums">{vazio ? "—" : total === 0 ? "Grátis" : formatarReais(total)}</span>
        </p>
        <Link href={href} aria-disabled={vazio} className={cn(estiloDoBotao.primary, vazio && "pointer-events-none opacity-60")}>
          {rotulo}
        </Link>
      </div>
    </div>
  );
}
