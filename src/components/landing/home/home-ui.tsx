import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Moldura com linhas-guia: a página clara emoldurada por um fio tracejado dos dois lados. */
export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="lp-moldura">
      <div className="lp-trilho">{children}</div>
    </div>
  );
}

/** Faixa de hachura entre blocos. */
export function Hatch() {
  return <div aria-hidden="true" className="lp-hachura" />;
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
    <div className={cn("lp-cab", padded && "lp-dentro")}>
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
    </div>
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
