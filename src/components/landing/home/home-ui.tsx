import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/** Moldura de largura: centraliza o conteúdo e dá o respiro lateral. Sem linhas-guia: as seções se separam só pelo espaço. */
export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="lp-moldura">
      <div className="lp-trilho">{children}</div>
    </div>
  );
}

/** Cabeçalho centrado de seção: etiqueta, título curto (com a segunda linha em ameixa) e uma frase. */
export function SectionHead({
  id,
  chip,
  title,
  accent,
  lead,
  padded,
}: {
  id: string;
  chip?: string;
  title: React.ReactNode;
  accent?: React.ReactNode;
  lead?: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <Reveal className={cn("lp-cab", padded && "lp-dentro")}>
      {chip ? <span className="lp-chip-sec">{chip}</span> : null}
      <h2 id={id} className="lp-titulo lp-h2">
        {title}
        {accent ? (
          <>
            <br />
            <span className="lp-cor">{accent}</span>
          </>
        ) : null}
      </h2>
      {lead ? <p className="lp-lead">{lead}</p> : null}
    </Reveal>
  );
}

type BtnTone = "ameixa" | "branco" | "claro";

/** Botão-link em pílula. `arrow` põe a setinha dentro de um círculo, como na landing aprovada. */
export function LinkButton({
  href,
  tone = "ameixa",
  arrow,
  className,
  children,
}: {
  href: string;
  tone?: BtnTone;
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn("lp-btn", `lp-btn-${tone}`, className)}>
      {children}
      {arrow ? (
        <span aria-hidden="true" className="lp-seta">
          <ArrowRight />
        </span>
      ) : null}
    </Link>
  );
}
