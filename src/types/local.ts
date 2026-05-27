// Tipos locais para uso em Client Components.
// NÃO importar de @prisma/client em "use client" — quebra o build (bundle do browser).

export const RsvpStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  DECLINED: "DECLINED",
} as const;
export type RsvpStatus = (typeof RsvpStatus)[keyof typeof RsvpStatus];

export const ExpenseStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
} as const;
export type ExpenseStatus = (typeof ExpenseStatus)[keyof typeof ExpenseStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  REJECTED: "REJECTED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  PIX: "PIX",
  CREDIT_CARD: "CREDIT_CARD",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export interface GuestLocal {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  rsvpStatus: RsvpStatus;
  allowedCompanions: number;
  hasReceivedMessage: boolean;
  createdAt: Date;
  updatedAt: Date;
  tableId?: string | null;
}

export interface GiftLocal {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  imageUrl?: string | null;
  isPurchased: boolean;
  createdAt: Date;
}

export interface VendorLocal {
  id: string;
  name: string;
  category: string;
  contact?: string | null;
  contractUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
  expenses?: ExpenseLocal[];
}

export interface ExpenseLocal {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: ExpenseStatus;
  createdAt: Date;
  vendorId: string;
  vendor: VendorLocal;
}
