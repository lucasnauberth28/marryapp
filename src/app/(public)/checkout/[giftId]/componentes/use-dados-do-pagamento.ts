// O estado de cada parte do pagamento: quem presenteia, o Pix gerado e o cartão digitado.
import { useState } from "react";
import { mascararTelefone } from "@/lib/formatacao/telefone";
import { useConvidadoSalvo } from "@/lib/use-saved-guest";

/**
 * Quem confirmou presença nesta aba já vem identificado; segue depois de confirmar "sim, sou eu".
 * "Não sou essa pessoa" esquece o que veio da confirmação e abre o formulário vazio.
 */
export function useIdentificacao(slug: string) {
  const { guest: knownGuest, forget } = useConvidadoSalvo(slug);
  const [typedName, setTypedName] = useState("");
  const [typedPhone, setTypedPhone] = useState("");
  const [dispensado, setDispensado] = useState(false);
  const recognized = knownGuest && !dispensado ? knownGuest : null;
  return {
    recognized,
    typedName,
    setTypedName,
    typedPhone,
    setTypedPhone,
    name: recognized ? recognized.name : typedName,
    phone: recognized ? mascararTelefone(recognized.phone) : typedPhone,
    dispensar: () => {
      forget();
      setDispensado(true);
    },
  };
}

export function usePixGerado() {
  const [payload, setPayload] = useState("");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  // Pix estático: o casal confere no extrato, não há confirmação automática.
  const [estatico, setEstatico] = useState(false);
  const [avisado, setAvisado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(payload);
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch {
      // Sem permissão para copiar (alguns navegadores): mostra o código para copiar à mão.
      setCopyFailed(true);
    }
  }

  return { payload, setPayload, transactionId, setTransactionId, copied, copyFailed, copiar, estatico, setEstatico, avisado, setAvisado };
}

export function useCartaoDigitado() {
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [installments, setInstallments] = useState(1);
  return { cardName, setCardName, cardNumber, setCardNumber, cardExpiry, setCardExpiry, cardCvv, setCardCvv, payerEmail, setPayerEmail, installments, setInstallments };
}

export type Identificacao = ReturnType<typeof useIdentificacao>;
export type PixGerado = ReturnType<typeof usePixGerado>;
export type CartaoDigitado = ReturnType<typeof useCartaoDigitado>;
