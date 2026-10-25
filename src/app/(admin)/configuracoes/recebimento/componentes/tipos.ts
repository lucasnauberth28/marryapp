export interface MascaraDaConta {
  type: "PIX_KEY" | "BANK_ACCOUNT";
  holderName: string;
  holderDocumentHint: string;
  keyHint: string;
  verifiedAt: string | null;
  updatedAt: string;
}

export type ModoDoRecebimento = "view" | "form" | "confirm" | "remove";

export const formatoDaData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
