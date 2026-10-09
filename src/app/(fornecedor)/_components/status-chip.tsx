import { Check, CircleAlert, CircleX, Hourglass, MessageCircle, Send, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEAD_STATUS_LABEL, type LeadStatus } from "../_lib/vendor-panel";

type Tone = "aviso" | "sucesso" | "perigo" | "neutro" | "salvia";

const TONE_CLASS: Record<Tone, string> = {
  aviso: "bg-aviso-suave text-aviso",
  sucesso: "bg-sucesso-suave text-sucesso",
  perigo: "bg-perigo-suave text-perigo",
  neutro: "bg-areia text-tinta",
  salvia: "bg-salvia-suave text-salvia",
};

/** Chip de status: sempre ícone + palavra (nunca só cor). */
export function Chip({
  tone,
  icon: Icon,
  children,
  className,
}: {
  tone: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] leading-4 font-semibold",
        TONE_CLASS[tone],
        className,
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.25} /> : null}
      {children}
    </span>
  );
}

const LEAD_STATUS_STYLE: Record<LeadStatus, { tone: Tone; icon: LucideIcon }> = {
  NEW: { tone: "aviso", icon: Sparkles },
  CONTACTED: { tone: "salvia", icon: MessageCircle },
  PROPOSAL_SENT: { tone: "neutro", icon: Send },
  CLOSED: { tone: "sucesso", icon: Check },
  DECLINED: { tone: "perigo", icon: CircleX },
};

export function LeadStatusChip({ status, suffix, className }: { status: LeadStatus; suffix?: string; className?: string }) {
  const { tone, icon } = LEAD_STATUS_STYLE[status];
  return (
    <Chip tone={tone} icon={icon} className={className}>
      {LEAD_STATUS_LABEL[status]}
      {suffix ? <span className="font-medium"> · {suffix}</span> : null}
    </Chip>
  );
}

const CURATION_STYLE: Record<string, { tone: Tone; icon: LucideIcon; label: string }> = {
  APPROVED: { tone: "sucesso", icon: ShieldCheck, label: "Aprovado na curadoria" },
  PENDING_APPROVAL: { tone: "aviso", icon: Hourglass, label: "Em análise pela curadoria" },
  REJECTED: { tone: "perigo", icon: CircleAlert, label: "Ajustes pedidos pela curadoria" },
};

export function CurationChip({ status }: { status: string }) {
  const style = CURATION_STYLE[status] ?? CURATION_STYLE.PENDING_APPROVAL;
  return (
    <Chip tone={style.tone} icon={style.icon}>
      {style.label}
    </Chip>
  );
}
