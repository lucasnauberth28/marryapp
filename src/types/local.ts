// Tipos locais para uso em Client Components.
// NÃO importar de @prisma/client em "use client" — quebra o build (bundle do browser).

export type RsvpStatus = "PENDING" | "CONFIRMED" | "DECLINED";
export type ExpenseStatus = "PENDING" | "PAID" | "OVERDUE";
export type PaymentStatus = "PENDING" | "APPROVED" | "FAILED" | "REFUNDED" | "REJECTED";
export type PaymentMethod = "PIX" | "CREDIT_CARD";

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
