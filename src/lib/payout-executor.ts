// CONTRATO do repasse ao casal, SEM implementação ativa. Hoje o Aceito NÃO move dinheiro para o destino cadastrado:
// o casal informa onde quer receber (WeddingPayoutAccount) e o repasse é liberado pela equipe.
//
// Quando o dono escolher o gateway (ver docs/repasse-gateway.md), uma classe que implemente `PayoutExecutor`
// entra aqui. Regras que qualquer implementação deve seguir:
//  - Decifrar o destino só no momento de enviar (decryptPayoutSecret), nunca guardar nem logar o valor aberto.
//  - Idempotência: o mesmo `idempotencyKey` nunca gera dois repasses.
//  - Repassar só o líquido calculado por payout-balance (bruto menos a taxa do Aceito) e só de destino com `verifiedAt`.
//  - Registrar cada tentativa no AuditLog (ator, casamento, valor, resultado), sem dado bancário.
//  - Nenhum repasse começa sem uma ação explícita e auditada da administração ou uma regra aprovada pelo dono.

export type PayoutDestination =
  | { kind: "PIX_KEY"; pixKeyType: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM"; pixKey: string; holderName: string; holderDocument: string }
  | {
      kind: "BANK_ACCOUNT";
      bankCode: string;
      agency: string;
      account: string;
      accountDigit: string;
      accountKind: "CORRENTE" | "POUPANCA" | "PAGAMENTO";
      holderName: string;
      holderDocument: string;
    };

export interface PayoutRequest {
  weddingId: string;
  /** Valor líquido a repassar, em centavos. */
  amountCents: number;
  /** Um por repasse: repetir a chamada com a mesma chave não pode pagar duas vezes. */
  idempotencyKey: string;
  /** Destino já decifrado, vivo só durante a chamada. */
  destination: PayoutDestination;
}

export type PayoutResult =
  | { status: "ACCEPTED"; gatewayReference: string }
  | { status: "REJECTED"; reason: "invalid_destination" | "insufficient_balance" | "gateway_refused" }
  | { status: "UNAVAILABLE" };

export interface PayoutExecutor {
  /** Nome do gateway, só para registro (ex.: "mercadopago", "asaas"). */
  readonly gateway: string;
  execute(request: PayoutRequest): Promise<PayoutResult>;
}

/** Hoje não há executor: o repasse é liberado pela equipe. Existe para a tela e a administração dizerem a verdade. */
export const PAYOUT_EXECUTOR_ACTIVE = false as const;
