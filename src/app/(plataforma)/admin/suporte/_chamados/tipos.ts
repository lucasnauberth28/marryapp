import type { SITUACOES_DO_CHAMADO } from "@/lib/platform/support";

export interface ItemDeChamado {
  id: string;
  number: number;
  subject: string;
  body: string | null;
  requesterName: string;
  requesterEmail: string | null;
  status: (typeof SITUACOES_DO_CHAMADO)[number];
  assigneeName: string | null;
  mine: boolean;
  internalNote: string | null;
  whenLabel: string;
  weddingId: string | null;
  vendorId: string | null;
}

export interface PreenchimentoDoChamado {
  weddingId?: string;
  vendorId?: string;
  requesterName: string;
  requesterEmail: string;
  label: string;
}
