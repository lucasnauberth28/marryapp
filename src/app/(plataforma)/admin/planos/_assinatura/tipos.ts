export interface AssinaturaDoPainel {
  id: string;
  accountName: string;
  companyName: string | null;
  accountType: "Casal" | "Fornecedor";
  planName: string;
  /** Já formatado em reais. */
  amount: string;
  gatewayId: string | null;
  createdAt: string;
  paidAt: string | null;
  periodEnd: string | null;
  email: string;
  method: string;
  status: { tone: "aviso" | "sucesso" | "perigo" | "neutro"; label: string };
  /** Pix estático pendente: pode ser confirmado ou recusado à mão. */
  checkable: boolean;
  /** Pagos têm recibo para imprimir. */
  receiptHref: string | null;
}

export const ESTILO_DO_BOTAO =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
