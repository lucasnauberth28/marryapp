import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Chip de status (`ac-chip`): sempre ícone e palavra, nunca só a cor.
 *   <StatusChip tone="sucesso" icon={CheckCircle2}>Ativo</StatusChip>
 *   <PlanChip plan="classic" />            (Básico, Classic, VIP, Adaptado, Start, Pro, Master)
 * tone: sucesso | aviso | perigo | neutro | salvia (categoria) | ameixa (destaque, ex.: VIP e Master).
 */
export type TomDaSituacao = "sucesso" | "aviso" | "perigo" | "neutro" | "salvia" | "ameixa";

const TONS: Record<TomDaSituacao, string> = {
  sucesso: "bg-sucesso-suave text-sucesso",
  aviso: "bg-aviso-suave text-aviso",
  perigo: "bg-perigo-suave text-perigo",
  neutro: "bg-areia text-tinta-suave",
  salvia: "bg-salvia-suave text-salvia",
  ameixa: "bg-ameixa-suave text-ameixa",
};

type TipoDeIcone = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false"; strokeWidth?: number | string }>;

export function EtiquetaDeSituacao({ tone, icon: Icon, children, className }: { tone: TomDaSituacao; icon?: TipoDeIcone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex min-h-7 w-fit items-center gap-1 whitespace-nowrap rounded-lg px-3 text-sm font-semibold leading-5", Icon && "pl-2", TONS[tone], className)}>
      {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} /> : null}
      {children}
    </span>
  );
}

const ESTILO_DO_PLANO: Record<string, { label: string; tone: TomDaSituacao }> = {
  basic: { label: "Básico", tone: "neutro" },
  classic: { label: "Classic", tone: "salvia" },
  vip: { label: "VIP", tone: "ameixa" },
  custom: { label: "Adaptado", tone: "salvia" },
  start: { label: "Start", tone: "neutro" },
  pro: { label: "Pro", tone: "salvia" },
  master: { label: "Master", tone: "ameixa" },
};

/** Plano pela chave do catálogo (Subscription.planId) ou pelo nível do fornecedor (FREE/PRO/MASTER, em qualquer caixa). */
export function EtiquetaDePlano({ plan, className }: { plan: string | null | undefined; className?: string }) {
  const key = (plan ?? "basic").toLowerCase() === "free" ? "start" : (plan ?? "basic").toLowerCase();
  const info = ESTILO_DO_PLANO[key] ?? { label: plan ?? "Básico", tone: "neutro" as const };
  return (
    <EtiquetaDeSituacao tone={info.tone} className={cn("pl-3", className)}>
      {info.label}
    </EtiquetaDeSituacao>
  );
}
