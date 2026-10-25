// Tipos e constantes da tela de despesas.
import { CreditCard, FileCheck, QrCode } from "lucide-react";

export interface BlocoDeParcelas {
  id: number;
  count: number;
  amount: string; // Ex: "300.00"
  startDate: string; // Ex: "2026-08-10"
}

export type TipoDeDespesa = "CONTRACT" | "PURCHASE";

export interface ItemDeDespesa {
  id: string;
  description: string;
  amount: number;
  dueDate: Date | string;
  status: string;
  type?: TipoDeDespesa | null;
  vendorId?: string | null;
  storeName?: string | null;
  purchaseUrl?: string | null;
  paymentMethod?: string | null;
  imageUrl?: string | null;
  vendor?: { name: string; category: string } | null;
}

export interface OpcaoDeFornecedor {
  id: string;
  name: string;
  category: string;
}

export interface CartaoDaCarteira {
  id: string;
  bank: string;
  nickname?: string | null;
  lastDigits?: string | null;
}

export interface DespesaAgrupada {
  id: string;
  baseDescription: string;
  vendorName: string;
  vendorCategory: string;
  type: TipoDeDespesa;
  storeName: string | null;
  purchaseUrl: string | null;
  paymentMethod: string | null;
  imageUrl: string | null;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paidCount: number;
  totalCount: number;
  nextDueDate: Date | string | null;
  nextDueAmount: number | null;
  nextDueExpenseId: string | null;
  expenses: ItemDeDespesa[];
}

/** Uma parcela pronta para ser enviada ao servidor. */
export interface ParcelaGerada {
  description: string;
  amount: number;
  dueDate: string;
  type: TipoDeDespesa;
  vendorId?: string | null;
  purchaseUrl?: string | null;
  paymentMethod?: string | null;
  imageUrl?: string | null;
  storeName?: string | null;
}

export interface FormaDePagamento {
  id: string;
  label: string;
  icon: typeof CreditCard;
}

export const FORMAS_DE_PAGAMENTO: FormaDePagamento[] = [
  { id: "credit_card_nubank", label: "Cartão de Crédito - Nubank", icon: CreditCard },
  { id: "credit_card_itau", label: "Cartão de Crédito - Itaú", icon: CreditCard },
  { id: "credit_card_other", label: "Cartão de Crédito (Outro)", icon: CreditCard },
  { id: "pix_balance", label: "Saldo em Conta / Pix", icon: QrCode },
  { id: "boleto", label: "Boleto Bancário", icon: FileCheck },
];

export const TAMANHO_DA_PAGINA_DOS_GRUPOS = 6;

export const hojeEmTextoIso = () => new Date().toISOString().split("T")[0];

export const BLOCO_INICIAL = (): BlocoDeParcelas => ({ id: 1, count: 3, amount: "300", startDate: hojeEmTextoIso() });
