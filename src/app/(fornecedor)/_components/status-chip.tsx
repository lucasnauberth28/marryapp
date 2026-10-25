import { Check, CircleAlert, CircleX, Hourglass, MessageCircle, Send, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROTULO_DA_SITUACAO_DO_PEDIDO, type SituacaoDoPedido } from "../_lib/pedidos";

type TomDaEtiqueta = "aviso" | "sucesso" | "perigo" | "neutro" | "salvia";

const CLASSE_DO_TOM: Record<TomDaEtiqueta, string> = {
  aviso: "bg-aviso-suave text-aviso",
  sucesso: "bg-sucesso-suave text-sucesso",
  perigo: "bg-perigo-suave text-perigo",
  neutro: "bg-areia text-tinta",
  salvia: "bg-salvia-suave text-salvia",
};

/** Chip de status: sempre ícone + palavra (nunca só cor). */
export function EtiquetaBase({
  tone,
  icon: Icon,
  children,
  className,
}: {
  tone: TomDaEtiqueta;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] leading-4 font-semibold",
        CLASSE_DO_TOM[tone],
        className,
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.25} /> : null}
      {children}
    </span>
  );
}

const ESTILO_DA_SITUACAO_DO_PEDIDO: Record<SituacaoDoPedido, { tone: TomDaEtiqueta; icon: LucideIcon }> = {
  NEW: { tone: "aviso", icon: Sparkles },
  CONTACTED: { tone: "salvia", icon: MessageCircle },
  PROPOSAL_SENT: { tone: "neutro", icon: Send },
  CLOSED: { tone: "sucesso", icon: Check },
  DECLINED: { tone: "perigo", icon: CircleX },
};

export function EtiquetaDaSituacaoDoPedido({ status, suffix, className }: { status: SituacaoDoPedido; suffix?: string; className?: string }) {
  const { tone, icon } = ESTILO_DA_SITUACAO_DO_PEDIDO[status];
  return (
    <EtiquetaBase tone={tone} icon={icon} className={className}>
      {ROTULO_DA_SITUACAO_DO_PEDIDO[status]}
      {suffix ? <span className="font-medium"> · {suffix}</span> : null}
    </EtiquetaBase>
  );
}

const ESTILO_DA_CURADORIA: Record<string, { tone: TomDaEtiqueta; icon: LucideIcon; label: string }> = {
  APPROVED: { tone: "sucesso", icon: ShieldCheck, label: "Aprovado na curadoria" },
  PENDING_APPROVAL: { tone: "aviso", icon: Hourglass, label: "Em análise pela curadoria" },
  REJECTED: { tone: "perigo", icon: CircleAlert, label: "Ajustes pedidos pela curadoria" },
};

export function EtiquetaDaCuradoria({ status }: { status: string }) {
  const style = ESTILO_DA_CURADORIA[status] ?? ESTILO_DA_CURADORIA.PENDING_APPROVAL;
  return (
    <EtiquetaBase tone={style.tone} icon={style.icon}>
      {style.label}
    </EtiquetaBase>
  );
}
