import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { aplicarPagamentoAprovado, marcarPagamentoComoFalho, reembolsarAssinatura } from "@/lib/subscriptions";

/** Pagamento de assinatura: libera, recusa ou estorna o plano. Repetições do webhook não mudam nada. */
export async function tratarPagamentoDeAssinatura(subscriptionId: string, paymentId: string, status: string | undefined, amountInReais: number | undefined) {
  if (status === "approved") {
    const result = await aplicarPagamentoAprovado(subscriptionId, { id: paymentId, amountInReais });
    if (result === "not_found") return NextResponse.json({ received: true, ignored: "subscription not found" });
    if (result === "amount_mismatch") return NextResponse.json({ success: false, error: "Amount mismatch" });
    if (result === "activated") {
      revalidatePath("/fornecedor", "layout");
      revalidatePath("/fornecedores");
    }
    return NextResponse.json({ success: true, alreadyApproved: result === "already" });
  }
  if (status === "rejected" || status === "cancelled") {
    await marcarPagamentoComoFalho(subscriptionId);
  } else if (status === "refunded" || status === "charged_back") {
    await reembolsarAssinatura(subscriptionId);
    revalidatePath("/fornecedor", "layout");
    revalidatePath("/fornecedores");
  }
  return NextResponse.json({ success: true });
}
