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



export interface GuestLocal {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  category?: string | null;
  rsvpStatus: RsvpStatus;
  allowedCompanions: number;
  confirmedCompanions?: number;
  companionsNames?: string | null;
  dietaryRestrictions?: string | null;
  hasReceivedMessage: boolean;
  parentGuestId?: string | null;
  parentGuest?: GuestLocal | null;
  linkedGuests?: GuestLocal[];
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

interface VendorLocal {
  id: string;
  name: string;
  category: string;
  contact?: string | null;
  contractUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
  expenses?: ExpenseLocal[];
}

interface ExpenseLocal {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: ExpenseStatus;
  createdAt: Date;
  vendorId: string;
  vendor: VendorLocal;
}
