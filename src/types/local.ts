// Tipos locais para uso em Client Components.
// NÃO importar de @prisma/client em "use client" — quebra o build (bundle do browser).

export const SituacaoDaConfirmacao = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  DECLINED: "DECLINED",
} as const;
export type SituacaoDaConfirmacao = (typeof SituacaoDaConfirmacao)[keyof typeof SituacaoDaConfirmacao];

export const SituacaoDaDespesa = {
  PENDING: "PENDING",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
} as const;
export type SituacaoDaDespesa = (typeof SituacaoDaDespesa)[keyof typeof SituacaoDaDespesa];



export interface ConvidadoLocal {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  category?: string | null;
  rsvpStatus: SituacaoDaConfirmacao;
  allowedCompanions: number;
  confirmedCompanions?: number;
  companionsNames?: string | null;
  dietaryRestrictions?: string | null;
  hasReceivedMessage: boolean;
  parentGuestId?: string | null;
  parentGuest?: ConvidadoLocal | null;
  linkedGuests?: ConvidadoLocal[];
  createdAt: Date;
  updatedAt: Date;
  tableId?: string | null;
}

export interface PresenteLocal {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  imageUrl?: string | null;
  isPurchased: boolean;
  createdAt: Date;
}

interface FornecedorLocal {
  id: string;
  name: string;
  category: string;
  contact?: string | null;
  contractUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
  expenses?: DespesaLocal[];
}

interface DespesaLocal {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: SituacaoDaDespesa;
  createdAt: Date;
  vendorId: string;
  vendor: FornecedorLocal;
}
