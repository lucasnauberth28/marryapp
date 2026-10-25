import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { CAMINHO_DA_PAGINA, ESTILO_DO_CARTAO } from "./estilos";

const BOTAO_CLARO = "inline-flex min-h-11 items-center rounded-xl border border-linha-forte bg-papel px-4 text-[15px] font-semibold text-tinta transition-colors hover:bg-areia";

export function SemAvaliacoes({ perfilPublico }: { perfilPublico: string | null }) {
  return (
    <Aparicao variant="fade" className={cn(ESTILO_DO_CARTAO, "flex flex-col items-center gap-3 px-6 py-12 text-center")}>
      <span className="grid size-12 place-items-center rounded-full bg-salvia-suave text-salvia">
        <Star aria-hidden="true" className="size-6" />
      </span>
      <p className="text-lg font-semibold">Nenhuma avaliação por aqui ainda</p>
      <p className="max-w-md text-tinta-suave">Nos pedidos fechados, use “Pedir avaliação”: o casal recebe um link só dele e a avaliação chega aqui como verificada, para você responder.</p>
      {perfilPublico ? (
        <Link href={perfilPublico} target="_blank" rel="noopener" className={cn(BOTAO_CLARO, "gap-2")}>
          Ver meu perfil público
          <ExternalLink aria-hidden="true" className="size-4" />
          <span className="sr-only">(abre em nova aba)</span>
        </Link>
      ) : null}
    </Aparicao>
  );
}

export function TudoRespondido() {
  return (
    <Aparicao variant="fade" className={cn(ESTILO_DO_CARTAO, "flex flex-col items-center gap-2 px-6 py-10 text-center")}>
      <p className="text-lg font-semibold">Tudo respondido</p>
      <p className="max-w-md text-tinta-suave">Você já respondeu todas as avaliações. As respostas estão no seu perfil público.</p>
      <Link href={`${CAMINHO_DA_PAGINA}?filtro=todas`} scroll={false} className={BOTAO_CLARO}>
        Ver todas as avaliações
      </Link>
    </Aparicao>
  );
}
