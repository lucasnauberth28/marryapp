import Link from "next/link";
import { Heart } from "lucide-react";
import { Esqueleto } from "@/components/ui/skeleton";
import { Selo } from "@/components/landing/seal";
import { estiloDoBotao } from "@/components/landing/styles";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { caminhoDoSiteDoCasamento } from "@/lib/wedding-links";
import { cn } from "@/lib/utils";
import { ESTILO_DO_SOBRETITULO, ESTILO_DO_TITULO, type PropriedadesDoPasso } from "./tipos";

export function PassoDoCartaoEmAnalise({ titulo }: PropriedadesDoPasso) {
  return (
    <div className="step-in flex flex-col items-center gap-4 rounded-[16px] border border-linha bg-papel px-6 py-10 text-center shadow-[var(--shadow-aceito-1)]">
      <Esqueleto className="h-2 w-40 rounded-full" />
      <h2 ref={titulo} tabIndex={-1} className={ESTILO_DO_TITULO}>
        Pagamento em análise
      </h2>
      <p className="max-w-[34ch] text-tinta-suave">O banco está analisando o seu pagamento. Esta página será atualizada automaticamente assim que ele for aprovado.</p>
    </div>
  );
}

interface PropriedadesDoSucesso extends PropriedadesDoPasso {
  coupleNames: string;
  slug: string;
  amount: number;
  pixAvisado: boolean;
}

export function PassoDeSucesso({ titulo, coupleNames, slug, amount, pixAvisado }: PropriedadesDoSucesso) {
  return (
    <div className="step-in flex flex-col items-center gap-4 pt-6 text-center">
      {/* O selo só marca pagamento concluído: com Pix avisado, ainda falta o casal conferir */}
      {pixAvisado ? (
        <span aria-hidden="true" className="grid size-24 place-items-center rounded-full bg-ameixa-suave text-ameixa">
          <Heart className="size-10" strokeWidth={1.5} />
        </span>
      ) : (
        <Selo label="Selo de pagamento" className="size-24 [&>span]:text-[54px]" />
      )}
      <h2 ref={titulo} tabIndex={-1} className="mt-2 font-display text-[40px] font-medium leading-[46px] tracking-[-0.015em] text-tinta outline-none">
        Obrigado pelo carinho!
      </h2>
      <p className="max-w-[34ch] text-tinta-suave">
        {pixAvisado ? `${coupleNames} já foram avisados do seu Pix e confirmam o presente assim que ele aparecer no extrato.` : `Seu presente foi confirmado e ${coupleNames} já foram avisados.`}
      </p>

      <div className="flex w-full flex-col items-center gap-1 rounded-[16px] border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)]">
        <span className={ESTILO_DO_SOBRETITULO}>{pixAvisado ? "Valor do Pix" : "Valor do presente"}</span>
        <span className="font-num text-[44px] leading-[48px] tabular-nums text-tinta">{formatarReais(amount)}</span>
      </div>

      <div className="mt-2 flex w-full flex-col gap-2">
        <Link href={caminhoDoSiteDoCasamento(slug, "rsvp")} className={cn(estiloDoBotao.primary, estiloDoBotao.block, "min-h-12")}>
          Confirmar presença
        </Link>
        <Link href={caminhoDoSiteDoCasamento(slug)} className={cn(estiloDoBotao.secondary, estiloDoBotao.block, "min-h-12")}>
          Ver o site do casal
        </Link>
      </div>
    </div>
  );
}
