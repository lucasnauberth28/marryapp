"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { GiftLocal as Gift } from "@/types/local";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPixTransactionAction,
  checkTransactionStatusAction,
  processCardPaymentAction,
} from "@/actions/payment-actions";
import { tokenizeCard } from "@/lib/mercadopago-client";
import { weddingSitePath } from "@/lib/wedding-links";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Heart,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  QrCode,
  Copy,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface CheckoutClientProps {
  gift: Gift;
  coupleNames: string;
  /** Casamento do presente (/casamento/<slug>) */
  slug: string;
}

type CheckoutStep = "IDENTIFICATION" | "METHOD" | "PAYMENT" | "SUCCESS";
type PaymentMethod = "PIX" | "CREDIT_CARD";

export function CheckoutClient({ gift, coupleNames, slug }: CheckoutClientProps) {
  const [step, setStep] = useState<CheckoutStep>("IDENTIFICATION");
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [isPending, startTransition] = useTransition();

  // Dados do Convidado
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Dados do Pix Gerado
  const [pixPayload, setPixPayload] = useState("");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Dados do Cartão
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardBank, setCardBank] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [installments, setInstallments] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Polling automático em tempo real para PIX Dinâmico via Mercado Pago
  useEffect(() => {
    if (step !== "PAYMENT" || !transactionId) return;

    const interval = setInterval(async () => {
      const res = await checkTransactionStatusAction(transactionId);
      if (res.approved) {
        clearInterval(interval);
        setStep("SUCCESS");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, transactionId]);

  // Conversão para Real
  function formatPrice(amount: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount / 100);
  }

  // Taxa do Cartão (Fórmula: ValorFinal = ValorPresente / (1 - 0.0499))
  const feePercent = 0.0499;
  const cardFinalAmount = Math.round(gift.amount / (1 - feePercent));

  // Identificação de Bandeira do Cartão (Padrão Mercado Pago: master, visa, amex, elo)
  const cardBrand = useMemo(() => {
    const cleanNumber = cardNumber.replace(/\s/g, "");
    if (cleanNumber.startsWith("4"))
      return { name: "Visa", mpId: "visa", color: "from-blue-600 to-blue-800" };
    if (cleanNumber.startsWith("5"))
      return { name: "Mastercard", mpId: "master", color: "from-red-500 to-orange-600" };
    if (cleanNumber.startsWith("3"))
      return { name: "Amex", mpId: "amex", color: "from-emerald-600 to-teal-800" };
    if (cleanNumber.startsWith("6"))
      return { name: "Discover", mpId: "discover", color: "from-orange-500 to-amber-600" };
    return { name: "Mastercard", mpId: "master", color: "from-zinc-800 to-zinc-950" };
  }, [cardNumber]);

  // Cor do Cartão baseada no Banco (ou na bandeira)
  const cardColor = useMemo(() => {
    const bank = cardBank.toLowerCase().trim();
    if (bank.includes("nubank")) return "from-purple-600 to-purple-800";
    if (bank.includes("itau")) return "from-orange-500 to-orange-700";
    if (bank.includes("bradesco")) return "from-red-600 to-red-800";
    if (bank.includes("inter")) return "from-orange-400 to-orange-600";
    if (bank.includes("santander")) return "from-red-700 to-red-900";
    if (bank.includes("caixa")) return "from-blue-600 to-blue-800";
    if (bank.includes("c6")) return "from-zinc-900 to-zinc-950";
    if (bank.includes("neon")) return "from-cyan-500 to-cyan-700";
    return cardBrand.color;
  }, [cardBank, cardBrand.color]);

  // Logotipo da Bandeira em SVG
  const BrandLogo = () => {
    if (cardBrand.name === "Visa") {
      return (
        <svg className="h-8 text-white fill-current" viewBox="0 0 100 32">
          <path d="M38.1 19.3L41.3 5H46.4L43.3 19.3H38.1ZM25.2 5.3C24.1 4.9 22.3 4.5 20.3 4.5C15.6 4.5 12.3 6.9 12.1 10.4C11.9 13 14.4 14.4 16.2 15.3C18.1 16.2 18.7 16.8 18.7 17.6C18.7 18.8 17.3 19.4 15.8 19.4C14.3 19.4 13.1 19 12 18.4L11.2 22.2C12.5 22.8 14.2 23.2 16 23.2C21.1 23.2 24.3 20.7 24.5 16.9C24.7 14.7 23.3 13.1 20.8 11.9C19.3 11.2 18.6 10.6 18.6 9.8C18.6 8.8 19.8 7.8 22.1 7.8C23.9 7.8 25.2 8.2 26.1 8.6L25.2 5.3ZM62.9 5H58.8C57.6 5 56.7 5.7 56.1 6.8L48.1 23H53.3L54.4 20H60.6L61.2 23H65.8L62.9 5ZM55.8 16.1L58.5 8.7L60.1 16.1H55.8ZM9.1 5L4.2 17.1L3.3 12.5C2.6 10 1.2 6.5 1.2 6.5C0.9 6 0 5 0 5H6.2L9.1 5Z" />
        </svg>
      );
    }
    if (cardBrand.name === "Mastercard") {
      return (
        <svg className="h-10" viewBox="0 0 100 60">
          <circle cx="35" cy="30" r="20" fill="#EB001B" fillOpacity="0.9" />
          <circle cx="65" cy="30" r="20" fill="#FF5F00" fillOpacity="0.9" />
          <circle cx="50" cy="30" r="20" fill="#FF5F00" fillOpacity="0.2" />
        </svg>
      );
    }
    return (
      <span className="text-sm font-bold tracking-wide italic text-white">
        {cardBrand.name}
      </span>
    );
  };

  function handleIdentificationNext(e: React.FormEvent) {
    e.preventDefault();
    if (guestName.length < 3 || guestPhone.length < 10) {
      setError("Por favor, preencha seus dados corretamente.");
      return;
    }
    setError(null);
    setStep("METHOD");
  }

  function handleProcessPayment() {
    setError(null);

    const toastId = toast.loading(method === "PIX" ? "Gerando cobrança Pix instantânea..." : "Processando pagamento seguro...");
    startTransition(async () => {
      if (method === "PIX") {
        const result = await createPixTransactionAction({
          giftId: gift.id,
          guestName,
          guestPhone,
        });

        if (result.success && result.pixPayload) {
          setPixPayload(result.pixPayload);
          setTransactionId(result.transactionId || null);
          setStep("PAYMENT");
          toast.success("Código Pix gerado com sucesso!", { id: toastId });
        } else {
          setError(result.error ?? "Erro ao gerar o Pix.");
          toast.error(result.error ?? "Erro ao gerar o Pix.", { id: toastId });
        }
      } else {
        if (!payerEmail || !cardNumber || !cardName || !cardExpiry || !cardCvv) {
          setError("Preencha todos os campos do cartão.");
          toast.error("Preencha todos os campos do cartão.", { id: toastId });
          return;
        }

        // Os dados do cartão vão direto para o Mercado Pago; o servidor recebe só o token.
        let card: { token: string; paymentMethodId: string };
        try {
          card = await tokenizeCard({ cardNumber, cardholderName: cardName, cardExpiry, securityCode: cardCvv });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Não foi possível validar o cartão.";
          setError(message);
          toast.error(message, { id: toastId });
          return;
        }

        const result = await processCardPaymentAction({
          giftId: gift.id,
          guestName,
          guestPhone,
          cardToken: card.token,
          paymentMethodId: card.paymentMethodId,
          installments,
          payerEmail,
        });

        if (result.success && result.status === "PENDING") {
          toast.info("Pagamento em análise pelo banco. Você será avisado assim que for aprovado.", { id: toastId });
          setTransactionId(result.transactionId || null);
          setStep("PAYMENT");
        } else if (result.success) {
          toast.success("Pagamento aprovado com sucesso! Muito obrigado pelo presente! 🎁", { id: toastId });
          setStep("SUCCESS");
        } else {
          setError(result.error ?? "Erro ao processar o pagamento.");
          toast.error(result.error ?? "Erro ao processar pagamento com cartão.", { id: toastId });
        }
      }
    });
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    toast.success("Código Copia e Cola copiado para a área de transferência! 📋");
    setTimeout(() => setCopied(false), 2000);
  }

  // Stepper UI
  const steps = [
    { key: "IDENTIFICATION", label: "Identificação" },
    { key: "METHOD", label: "Pagamento" },
    { key: "PAYMENT", label: "Finalização" },
  ];

  return (
    <div className="bg-papel rounded-[40px] border border-linha/60 shadow-2xl overflow-hidden p-12 transition-all duration-300 relative">
      <div className="absolute top-0 left-0 right-0 h-2 bg-linho flex">
        {steps.map((s, idx) => {
          const activeIdx = steps.findIndex((st) => st.key === step);
          const isCurrent =
            s.key === step || (step === "SUCCESS" && s.key === "PAYMENT");
          const isPassed = activeIdx > idx;

          return (
            <div
              key={s.key}
              className={`flex-1 h-full transition-colors duration-500 ${
                isCurrent
                  ? "bg-zinc-900"
                  : isPassed
                    ? "bg-linha-forte"
                    : "bg-transparent"
              }`}
            />
          );
        })}
      </div>

      {/* Resumo do Presente Premium */}
      <div className="flex items-center gap-5 pb-8 border-b border-linha/80 mb-10 mt-2">
        {gift.imageUrl ? (
          <img
            src={gift.imageUrl}
            alt={gift.title}
            className="w-24 h-24 object-cover rounded-[24px] border border-linha/50 shadow-md transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-24 h-24 bg-linho border border-linha rounded-[24px] flex items-center justify-center text-4xl shadow-sm">
            🎁
          </div>
        )}
        <div className="space-y-1">
          <span className="text-xs font-bold text-tinta-suave uppercase tracking-widest">
            Presente Selecionado
          </span>
          <h3 className="text-2xl font-black text-tinta leading-tight tracking-tight">
            {gift.title}
          </h3>
          <span className="text-sucesso font-extrabold text-lg block">
            {formatPrice(gift.amount)}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* PASSO 1: IDENTIFICAÇÃO */}
        {step === "IDENTIFICATION" && (
          <motion.form
            key="id"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onSubmit={handleIdentificationNext}
            className="space-y-6"
          >
            <div className="text-center pb-2">
              <h2 className="text-3xl font-black text-tinta tracking-tight">
                Identificação
              </h2>
              <p className="text-tinta-suave text-sm mt-1">
                Rapidamente, nos conte quem é você!
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-tinta-suave uppercase tracking-wider">
                Nome Completo
              </label>
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Como quer ser chamado"
                required
                className="bg-linho/50 border-linha rounded-2xl h-12 px-4 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-tinta-suave uppercase tracking-wider">
                WhatsApp
              </label>
              <Input
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                required
                className="bg-linho/50 border-linha rounded-2xl h-12 px-4 font-medium"
              />
            </div>

            {error && (
              <p className="text-sm text-perigo bg-perigo-suave p-4 rounded-2xl font-medium">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-full h-14 text-base font-bold gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Escolher Forma de Pagamento <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.form>
        )}

        {/* PASSO 2: ESCOLHA DO MÉTODO & CARTÃO */}
        {step === "METHOD" && (
          <motion.div
            key="method"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            <div className="text-center pb-2">
              <h2 className="text-3xl font-black text-tinta tracking-tight">
                Forma de Pagamento
              </h2>
              <p className="text-tinta-suave text-sm mt-1">
                Escolha a melhor condição para você.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Opção PIX */}
              <button
                type="button"
                onClick={() => setMethod("PIX")}
                className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all duration-300 text-left ${
                  method === "PIX"
                    ? "border-zinc-900 bg-linho shadow-md scale-[1.02]"
                    : "border-linha hover:border-linha hover:bg-linho/30"
                }`}
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-sucesso">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-tinta text-base">Pix</h4>
                  <p className="text-xs text-tinta-suave font-medium">
                    À vista s/ juros
                  </p>
                  <span className="text-lg font-extrabold text-tinta block mt-1">
                    {formatPrice(gift.amount)}
                  </span>
                </div>
              </button>

              {/* Opção CARTÃO */}
              <button
                type="button"
                onClick={() => setMethod("CREDIT_CARD")}
                className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all duration-300 text-left ${
                  method === "CREDIT_CARD"
                    ? "border-zinc-900 bg-linho shadow-md scale-[1.02]"
                    : "border-linha hover:border-linha hover:bg-linho/30"
                }`}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-tinta text-base">Cartão</h4>
                  <p className="text-xs text-tinta-suave font-medium">
                    Em até 12x
                  </p>
                  <span className="text-lg font-extrabold text-tinta block mt-1">
                    {formatPrice(cardFinalAmount)}
                  </span>
                </div>
              </button>
            </div>

            {/* FLUXO CARTÃO INTERATIVO */}
            {method === "CREDIT_CARD" && (
              <div className="space-y-6 pt-2">
                {/* Cartão Visual Animado */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`w-full h-56 bg-gradient-to-r ${cardColor} rounded-[30px] p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-500`}
                >
                  <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-papel/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase font-bold text-white/60 tracking-widest">
                        {cardBank || "Banco do Usuário"}
                      </span>
                      <CreditCard className="w-9 h-9 mt-3 text-white" />
                    </div>
                    <div className="flex items-center bg-papel/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                      <BrandLogo />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-xl md:text-2xl font-mono tracking-widest block">
                      {cardNumber
                        ? cardNumber.replace(/(\d{4})/g, "$1 ").trim()
                        : "•••• •••• •••• ••••"}
                    </span>

                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-xs uppercase text-white/50 tracking-wider font-bold">
                          Titular do Cartão
                        </span>
                        <span className="text-base font-bold tracking-wide uppercase truncate max-w-[220px]">
                          {cardName || "NOME NO CARTÃO"}
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-xs uppercase text-white/50 tracking-wider font-bold">
                          Validade
                        </span>
                        <span className="text-base font-bold font-mono">
                          {cardExpiry || "MM/AA"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* FORMULÁRIO DE DADOS DO CARTÃO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-tinta-suave uppercase tracking-wider">
                      E-mail para Comprovante
                    </label>
                    <Input
                      type="email"
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="bg-linho/50 border-linha h-12 rounded-2xl font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-tinta-suave uppercase tracking-wider">
                      Banco Emissor
                    </label>
                    <Input
                      value={cardBank}
                      onChange={(e) => setCardBank(e.target.value)}
                      placeholder="Ex: Nubank, Itaú, Bradesco"
                      className="bg-linho/50 border-linha h-12 rounded-2xl font-medium"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-tinta-suave uppercase tracking-wider">
                      Nome Impresso no Cartão
                    </label>
                    <Input
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      placeholder="JOAO M SILVA"
                      className="bg-linho/50 border-linha h-12 rounded-2xl font-bold uppercase"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-tinta-suave uppercase tracking-wider">
                      Número do Cartão
                    </label>
                    <Input
                      value={cardNumber}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "").substring(0, 16);
                        setCardNumber(raw);
                      }}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="bg-linho/50 border-linha h-12 rounded-2xl font-mono text-base font-bold tracking-wider"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-tinta-suave uppercase tracking-wider">
                      Validade (MM/AA)
                    </label>
                    <Input
                      value={cardExpiry}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "").substring(0, 4);
                        if (raw.length >= 3) {
                          setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
                        } else {
                          setCardExpiry(raw);
                        }
                      }}
                      placeholder="MM/AA"
                      maxLength={5}
                      className="bg-linho/50 border-linha h-12 rounded-2xl font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-tinta-suave uppercase tracking-wider">
                      Código de Segurança (CVV)
                    </label>
                    <Input
                      type="password"
                      value={cardCvv}
                      onChange={(e) =>
                        setCardCvv(
                          e.target.value.replace(/\D/g, "").substring(0, 4)
                        )
                      }
                      placeholder="123"
                      maxLength={4}
                      className="bg-linho/50 border-linha h-12 rounded-2xl font-mono font-bold"
                    />
                  </div>

                  {/* SELEÇÃO DE PARCELAS (MÁX 12X) */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-tinta-suave uppercase tracking-wider">
                      Opções de Parcelamento
                    </label>
                    <Select
                      value={String(installments)}
                      onValueChange={(val) => setInstallments(Number(val))}
                    >
                      <SelectTrigger className="w-full bg-linho/50 border border-linha h-12 rounded-2xl px-4 font-semibold text-tinta">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(12)].map((_, i) => {
                          const count = i + 1;
                          const installmentAmount = Math.round(
                            cardFinalAmount / count
                          );
                          return (
                            <SelectItem key={count} value={String(count)} className="font-medium">
                              {count}x de {formatPrice(installmentAmount)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-perigo bg-perigo-suave p-4 rounded-2xl font-medium">
                {error}
              </p>
            )}

            <div className="flex gap-4 pt-2 flex-col">
              <Button
                onClick={handleProcessPayment}
                disabled={isPending}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800 rounded-full h-14 text-base font-bold gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                {isPending
                  ? "Processando..."
                  : method === "PIX"
                    ? "Gerar Pix"
                    : "Finalizar Presente"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep("IDENTIFICATION")}
                className="rounded-full h-14 px-6 text-tinta-suave font-bold"
              >
                <ArrowLeft className="w-5 h-5 mr-1" /> Voltar
              </Button>
            </div>
          </motion.div>
        )}

        {/* PASSO 3: PAGAMENTO PIX */}
        {step === "PAYMENT" && method === "PIX" && (
          <motion.div
            key="pix-pay"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 flex flex-col items-center text-center"
          >
            <div className="pb-1">
              <h2 className="text-3xl font-black text-tinta tracking-tight">
                Efetue o Pix
              </h2>
              <p className="text-tinta-suave text-sm mt-1">
                Aponte a câmera do seu banco ou copie o código PIX abaixo.
              </p>
            </div>

            <div className="bg-papel p-6 rounded-[36px] border-4 border-linho shadow-inner">
              <QRCodeSVG value={pixPayload} size={240} />
            </div>

            <div className="w-full space-y-3">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="w-full rounded-full h-14 gap-2 text-tinta font-extrabold border-2 hover:bg-linho shadow-sm text-sm"
              >
                {copied ? (
                  <CheckCircle2 className="w-5 h-5 text-sucesso" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
                {copied
                  ? "Código Copiado com Sucesso!"
                  : "Copiar Código Pix Copia e Cola"}
              </Button>

              <div className="flex items-center justify-center gap-2.5 text-brand bg-brand-50 border border-brand/20 font-semibold text-xs py-3 px-4 rounded-2xl w-full shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin text-brand" />
                <span>Aguardando confirmação automática do pagamento...</span>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => setStep("METHOD")}
              className="rounded-full h-10 gap-1 text-tinta-suave hover:text-tinta-suave font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Alterar Forma de Pagamento
            </Button>
          </motion.div>
        )}

        {/* PASSO 3: CARTÃO EM ANÁLISE */}
        {step === "PAYMENT" && method === "CREDIT_CARD" && (
          <motion.div
            key="card-review"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 flex flex-col items-center text-center py-4"
          >
            <Loader2 className="w-10 h-10 animate-spin text-brand" />
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-tinta tracking-tight">Pagamento em análise</h2>
              <p className="text-tinta-suave text-sm max-w-sm">
                O banco está analisando o seu pagamento. Esta página será atualizada automaticamente assim que ele for aprovado.
              </p>
            </div>
          </motion.div>
        )}

        {/* PASSO 4: SUCESSO (CARTÃO) */}
        {step === "SUCCESS" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 flex flex-col items-center text-center py-4"
          >
            <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center text-brand shadow-sm border border-brand/20">
              <Heart className="w-12 h-12 fill-brand" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-display text-tinta tracking-tight">
                Obrigado pelo carinho!
              </h2>
              <p className="text-tinta-suave text-base max-w-sm">
                Seu presente foi confirmado e {coupleNames} já foram avisados.
              </p>
            </div>

            <div className="bg-brand-50 text-tinta border border-brand/15 rounded-3xl p-6 w-full">
              <span className="text-xs font-semibold uppercase tracking-wider block text-brand-600 mb-1">
                Valor do presente
              </span>
              <span className="text-4xl font-semibold tracking-tight tabular-nums">
                {formatPrice(gift.amount)}
              </span>
            </div>

            <div className="w-full grid gap-3 sm:grid-cols-2">
              <Button asChild className="rounded-full h-12 font-semibold">
                <Link href={weddingSitePath(slug, "rsvp")}>Confirmar presença</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full h-12 font-semibold">
                <Link href={weddingSitePath(slug)}>Ver o site do casal</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
