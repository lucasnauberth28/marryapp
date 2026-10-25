import { Check, Clock, CreditCard, Undo2 } from "lucide-react";
import type { TomDaEtiqueta } from "@/components/casal/ui";

export interface PagamentoDoPresente {
  id: string;
  from: string;
  giftTitle: string;
  /** Em centavos. */
  amount: number;
  when: string;
  situation: "pix" | "card" | "toCheck" | "refunded";
}

export interface ResumoDosPresentes {
  receivedCents: number;
  receivedCount: number;
  receivedPeople: number;
  toCheckCents: number;
  toCheckCount: number;
}

export const SITUACAO: Record<PagamentoDoPresente["situation"], { tone: TomDaEtiqueta; icon: typeof Check; label: string }> = {
  pix: { tone: "sucesso", icon: Check, label: "Pix recebido" },
  card: { tone: "sucesso", icon: CreditCard, label: "Cartão recebido" },
  toCheck: { tone: "aviso", icon: Clock, label: "A conferir" },
  refunded: { tone: "neutro", icon: Undo2, label: "Estornado" },
};
