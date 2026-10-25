import { registrarEventoDeServico } from "@/lib/platform/system-records";

/** O que o corpo da resposta diz sobre o aviso (sem dados de pagamento). */
interface CorpoDaResposta {
  error?: string;
  success?: boolean;
  ignored?: string;
}

function mensagemDoResultado(status: number, body: CorpoDaResposta | null): string | null {
  if (status === 401) return "Assinatura inválida";
  if (status === 400) return "Aviso sem o id do pagamento";
  if (status >= 500) return "Erro interno ao processar";
  if (body?.error === "Amount mismatch") return "Valor pago diferente do cobrado";
  if (body?.success === false) return "Não aplicado";
  if (body?.ignored) return `Ignorado: ${body.ignored}`.slice(0, 120);
  return null;
}

/**
 * Registra o resultado de cada aviso para a Saúde do sistema (sem corpo da notificação nem dados de pagamento:
 * só o resultado e o id numérico do pagamento). Registrar nunca atrapalha a resposta ao Mercado Pago.
 */
export async function registrarResultadoDoAviso(req: Request, response: Response) {
  try {
    const paymentId = new URL(req.url).searchParams.get("data.id");
    const body = (await response.clone().json().catch(() => null)) as CorpoDaResposta | null;
    const ok = response.status < 400 && body?.success !== false;
    await registrarEventoDeServico({
      service: "mercadopago",
      kind: "webhook",
      ok,
      message: mensagemDoResultado(response.status, body),
      refId: paymentId && /^\d+$/.test(paymentId) ? paymentId : null,
    });
  } catch {
    // registrar nunca atrapalha a resposta ao Mercado Pago
  }
}
