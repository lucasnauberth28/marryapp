import type { ComponentType, ReactNode } from "react";
import { Info, Power } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusChip } from "@/components/plataforma/status-chip";

/**
 * Avisos de contexto.
 *   <Notice tone="aviso" icon={Info} title="A Liz ainda não foi ativada" aside={<NotActiveTag />}>Você já pode configurar…</Notice>
 *   <NotActiveTag />                 chip "Desligada" para recurso que existe no desenho mas ainda não está ativo.
 *   <NotMeasured>explicação</NotMeasured>   no lugar de um número que o sistema ainda não mede ("Ainda não medimos").
 * Regra de honestidade: bloco sem fonte de dados real NUNCA mostra o número de exemplo do desenho; use <NotMeasured> ou omita.
 * tone: aviso (padrão) | neutro | perigo | sucesso.
 */
const NOTICE: Record<"aviso" | "neutro" | "perigo" | "sucesso", string> = {
  aviso: "border-aviso/40 bg-aviso-suave",
  neutro: "border-linha bg-areia",
  perigo: "border-perigo/40 bg-perigo-suave",
  sucesso: "border-sucesso/30 bg-sucesso-suave",
};

export function Notice({
  tone = "aviso",
  icon: Icon = Info,
  title,
  children,
  aside,
  className,
}: {
  tone?: keyof typeof NOTICE;
  icon?: ComponentType<{ className?: string; strokeWidth?: number | string; "aria-hidden"?: boolean | "true" | "false" }>;
  title?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" className={cn("flex flex-wrap items-start gap-3 rounded-2xl border px-4 py-3.5", NOTICE[tone], className)}>
      <Icon className="mt-0.5 size-5 shrink-0 text-tinta" strokeWidth={1.6} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold leading-6 text-tinta">{title}</p>}
        {children && <div className="text-sm leading-5 text-tinta">{children}</div>}
      </div>
      {aside}
    </div>
  );
}

/** Chip "Desligada" (recurso ainda sem ativação). */
export function NotActiveTag({ children = "Desligada" }: { children?: ReactNode }) {
  return (
    <StatusChip tone="neutro" icon={Power}>
      {children}
    </StatusChip>
  );
}
