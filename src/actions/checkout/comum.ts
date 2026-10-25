// Checkout de presentes: validação e ajudas das ações públicas (não são ações).
// Nenhuma ação do checkout pode aprovar pagamento por conta própria: aprovação só vem do Mercado Pago
// (webhook/consulta) ou da conferência manual do casal em /financas.
import { z } from "zod";
import prisma from "@/lib/prisma";
import { casamentoEstaSuspenso, MENSAGEM_DE_SITE_INDISPONIVEL } from "@/lib/wedding-suspension";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import { ERROS } from "@/lib/mensagens-de-erro";

export const EsquemaDaIdentidadeDoConvidado = z.object({
  giftId: z.string().uuid("Presente inválido."),
  guestName: z.string().trim().min(3, "Informe seu nome.").max(120),
  guestPhone: z
    .string()
    .transform((v) => somenteDigitos(v))
    .refine((v) => v.length >= 10 && v.length <= 13, "Telefone inválido."),
  guestEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
});

export const EsquemaDoPagamentoComCartao = EsquemaDaIdentidadeDoConvidado.extend({
  cardToken: z.string().min(10).max(200),
  paymentMethodId: z.string().regex(/^[a-z_]{2,30}$/),
  installments: z.coerce.number().int().min(1).max(12),
  payerEmail: z.string().trim().email("Informe um e-mail válido.").max(200),
});

export function separarNome(name: string) {
  const [first, ...rest] = name.split(" ");
  return { first_name: first, last_name: rest.join(" ") || "Convidado" };
}

/** O presente a pagar: precisa existir, estar livre e ser de um casamento no ar. */
export async function presenteParaPagar(giftId: string) {
  const gift = await prisma.gift.findUnique({ where: { id: giftId } });
  if (!gift) return { error: ERROS.presenteNaoEncontrado } as const;
  if (gift.isPurchased) return { error: "Este presente já foi comprado." } as const;
  if (await casamentoEstaSuspenso(gift.weddingId)) return { error: MENSAGEM_DE_SITE_INDISPONIVEL } as const;
  return { gift } as const;
}

/** Por que o banco recusou o cartão, em palavras que o convidado entende. */
export const MENSAGEM_DA_RECUSA_DO_CARTAO: Record<string, string> = {
  cc_rejected_bad_filled_card_number: "Número do cartão incorreto.",
  cc_rejected_bad_filled_date: "Data de validade incorreta.",
  cc_rejected_bad_filled_security_code: "Código CVV incorreto.",
  cc_rejected_bad_filled_other: "Dados do cartão incompletos ou incorretos.",
  cc_rejected_insufficient_amount: "Cartão sem limite ou saldo suficiente.",
  cc_rejected_high_risk: "Recusado pelo sistema antifraude.",
  cc_rejected_card_disabled: "Cartão bloqueado ou desativado pelo banco.",
  cc_rejected_call_for_authorize: "Pagamento pendente de autorização no aplicativo do seu banco.",
  cc_rejected_duplicated_payment: "Pagamento duplicado detectado em curto intervalo.",
};
