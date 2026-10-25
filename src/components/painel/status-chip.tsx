import type { ReactNode } from "react";
import { Check, Clock, X } from "lucide-react";
import { estiloBaseDaEtiqueta, estiloDoTomDaEtiqueta, type TomDaEtiqueta } from "./styles";

export function EtiquetaDeSituacao({ tone, icon, children, className = "" }: { tone: TomDaEtiqueta; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={`${estiloBaseDaEtiqueta} ${estiloDoTomDaEtiqueta[tone]} ${className}`}>
      {icon}
      {children}
    </span>
  );
}

type TipoDeConfirmacao = "PENDING" | "CONFIRMED" | "DECLINED";

const ESTILO_DA_CONFIRMACAO: Record<TipoDeConfirmacao, { tone: TomDaEtiqueta; label: string; Icon: typeof Check }> = {
  CONFIRMED: { tone: "sucesso", label: "Confirmado", Icon: Check },
  PENDING: { tone: "aviso", label: "Sem resposta", Icon: Clock },
  DECLINED: { tone: "perigo", label: "Não vai", Icon: X },
};

/** Selo da resposta do convidado: ícone e palavra, nunca só a cor. */
export function EtiquetaDeConfirmacao({ status }: { status: TipoDeConfirmacao }) {
  const { tone, label, Icon } = ESTILO_DA_CONFIRMACAO[status];
  return (
    <EtiquetaDeSituacao tone={tone} icon={<Icon className="size-4" strokeWidth={2} aria-hidden="true" />}>
      {label}
    </EtiquetaDeSituacao>
  );
}
