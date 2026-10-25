import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { TomDaSituacao } from "@/components/plataforma/status-chip";
import type { TIPOS_DE_SOLICITACAO_DE_DADOS } from "@/lib/platform/support";

export interface ItemDeSolicitacaoDeDados {
  id: string;
  type: (typeof TIPOS_DE_SOLICITACAO_DE_DADOS)[number];
  requesterName: string;
  requesterEmail: string;
  linked: boolean;
  status: "NEW" | "IN_REVIEW" | "DONE" | "REFUSED";
  receivedLabel: string;
  dueLabel: string;
  /** Texto do prazo ("vence em 4 dias", "venceu há 2 dias") e o tom do chip; closed = sem chip. */
  dueText: string | null;
  dueTone: "perigo" | "neutro" | null;
  note: string | null;
}

export const SITUACAO_DO_ITEM: Record<ItemDeSolicitacaoDeDados["status"], { label: string; tone: TomDaSituacao; icon: typeof Clock }> = {
  NEW: { label: "Novo", tone: "aviso", icon: Clock },
  IN_REVIEW: { label: "Em análise", tone: "aviso", icon: Clock },
  DONE: { label: "Pronto", tone: "salvia", icon: CheckCircle2 },
  REFUSED: { label: "Recusado", tone: "neutro", icon: XCircle },
};
