// Selos pequenos da tabela de pagamentos: situação (recebido, a conferir...) e forma (Pix ou cartão).
import { Check, Clock, CreditCard, QrCode, Undo2, X } from "lucide-react";
import { Etiqueta, type TomDaEtiqueta } from "@/components/casal/ui";

const SITUACOES: Record<string, { label: string; tone: TomDaEtiqueta; icon: typeof Clock }> = {
  APPROVED: { label: "Recebido", tone: "sucesso", icon: Check },
  PENDING: { label: "A conferir", tone: "aviso", icon: Clock },
  FAILED: { label: "Não passou", tone: "perigo", icon: X },
  REFUNDED: { label: "Estornado", tone: "neutro", icon: Undo2 },
  REJECTED: { label: "Recusado", tone: "perigo", icon: X },
};

export function SeloDeSituacao({ status }: { status: string }) {
  const c = SITUACOES[status] || SITUACOES.PENDING;
  return <Etiqueta tone={c.tone} icon={c.icon}>{c.label}</Etiqueta>;
}

export function SeloDaForma({ method }: { method: string }) {
  const pix = method === "PIX";
  const Icone = pix ? QrCode : CreditCard;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-tinta">
      <Icone aria-hidden="true" className="size-4 text-tinta-suave" />
      {pix ? "Pix" : "Cartão"}
    </span>
  );
}
