// A máquina de etapas do pagamento: identificação, forma, Pix/cartão e sucesso, com a conferência automática do Pix.
import { useEffect, useState, useTransition } from "react";
import { criarTransacaoPix } from "@/actions/checkout/pix";
import { conferirSituacaoDaTransacao } from "@/actions/checkout/situacao";
import { processarPagamentoComCartao } from "@/actions/checkout/cartao";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import { tokenizarCartao } from "@/lib/pagamento/mercadopago-client";
import { useCartaoDigitado, useIdentificacao, usePixGerado, type CartaoDigitado, type PixGerado } from "./use-dados-do-pagamento";
import type { EtapaDoPagamento, FormaDePagamento } from "./tipos";

interface ContextoDoPagamento {
  giftId: string;
  guestName: string;
  guestPhone: string;
  pix: PixGerado;
  cartao: CartaoDigitado;
  irParaEtapa: (etapa: EtapaDoPagamento) => void;
  mostrarErro: (mensagem: string) => void;
}

async function gerarPix({ giftId, guestName, guestPhone, pix, irParaEtapa, mostrarErro }: ContextoDoPagamento) {
  const result = await criarTransacaoPix({ giftId, guestName, guestPhone });
  if (result.success && result.pixPayload) {
    pix.setPayload(result.pixPayload);
    pix.setEstatico(!("isDynamicMp" in result && result.isDynamicMp));
    pix.setTransactionId(result.transactionId || null);
    irParaEtapa("PAYMENT");
  } else {
    mostrarErro(result.error ?? "Erro ao gerar o Pix.");
    irParaEtapa("METHOD");
  }
}

async function pagarNoCartao({ giftId, guestName, guestPhone, pix, cartao, irParaEtapa, mostrarErro }: ContextoDoPagamento) {
  const { payerEmail, cardNumber, cardName, cardExpiry, cardCvv, installments } = cartao;
  if (!payerEmail || !cardNumber || !cardName || !cardExpiry || !cardCvv) return mostrarErro("Preencha todos os campos do cartão.");

  // Os dados do cartão vão direto para o Mercado Pago; o servidor recebe só o token.
  let card: { token: string; paymentMethodId: string };
  try {
    card = await tokenizarCartao({ cardNumber, cardholderName: cardName, cardExpiry, securityCode: cardCvv });
  } catch (err) {
    return mostrarErro(err instanceof Error ? err.message : "Não foi possível validar o cartão.");
  }

  const result = await processarPagamentoComCartao({ giftId, guestName, guestPhone, cardToken: card.token, paymentMethodId: card.paymentMethodId, installments, payerEmail });
  if (result.success && result.status === "PENDING") {
    pix.setTransactionId(result.transactionId || null);
    irParaEtapa("PAYMENT");
  } else if (result.success) irParaEtapa("SUCCESS");
  else mostrarErro(result.error ?? "Erro ao processar o pagamento.");
}

/** Polling automático em tempo real para o Pix dinâmico (e o cartão em análise) do Mercado Pago. */
function useConferenciaAutomatica(step: EtapaDoPagamento, transactionId: string | null, irParaEtapa: (etapa: EtapaDoPagamento) => void) {
  useEffect(() => {
    if (step !== "PAYMENT" || !transactionId) return;
    const interval = setInterval(async () => {
      const res = await conferirSituacaoDaTransacao(transactionId);
      if (res.approved) {
        clearInterval(interval);
        irParaEtapa("SUCCESS");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, transactionId, irParaEtapa]);
}

export function usePagamento(giftId: string, slug: string) {
  const [step, setStep] = useState<EtapaDoPagamento>("IDENTIFICATION");
  const [method, setMethod] = useState<FormaDePagamento>("PIX");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const identificacao = useIdentificacao(slug);
  const pix = usePixGerado();
  const cartao = useCartaoDigitado();
  useConferenciaAutomatica(step, pix.transactionId, setStep);

  function continuarDaIdentificacao(e: React.FormEvent) {
    e.preventDefault();
    if (identificacao.name.trim().length < 3 || somenteDigitos(identificacao.phone).length < 10) {
      setError("Confira o nome completo e o WhatsApp com DDD para continuar.");
      return;
    }
    setError(null);
    setStep("METHOD");
  }

  function processar() {
    setError(null);
    // Pix: já mostra a etapa do código (com esqueleto) enquanto o servidor gera; se falhar, volta com o erro.
    if (method === "PIX") {
      pix.setPayload("");
      pix.setTransactionId(null);
      setStep("PAYMENT");
    }
    const contexto: ContextoDoPagamento = { giftId, guestName: identificacao.name, guestPhone: identificacao.phone, pix, cartao, irParaEtapa: setStep, mostrarErro: setError };
    startTransition(async () => {
      await (method === "PIX" ? gerarPix(contexto) : pagarNoCartao(contexto));
    });
  }

  return { step, setStep, method, setMethod, error, isPending, identificacao, pix, cartao, continuarDaIdentificacao, processar };
}
