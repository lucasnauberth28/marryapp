import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { estiloDoBotao, estiloDoBotaoComSeta } from "@/components/landing/styles";
import { cn } from "@/lib/utils";
import { mensagemDeUpgrade, tituloDeUpgrade, type ModuloComBloqueio } from "@/lib/casamento/wedding-plan-modules";

/** Aviso amigável no lugar de um recurso que o plano do casamento ainda não inclui. */
export function CartaoDeUpgrade({ moduleId }: { moduleId: ModuloComBloqueio }) {
  return (
    <section
      aria-labelledby="upgrade-recurso-titulo"
      className="mx-auto flex max-w-xl flex-col items-start gap-4 rounded-2xl border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)] sm:p-8"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-ameixa-suave text-ameixa">
        <Lock aria-hidden="true" className="size-5" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 id="upgrade-recurso-titulo" className="font-display text-[28px] leading-8 text-tinta">
          {tituloDeUpgrade(moduleId)}
        </h1>
        <p className="text-[15px] leading-6 text-tinta-suave">{mensagemDeUpgrade(moduleId)}</p>
      </div>
      <Link href="/plano" className={cn(estiloDoBotao.primary, "min-h-11")}>
        Ver planos
        <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
      </Link>
    </section>
  );
}
