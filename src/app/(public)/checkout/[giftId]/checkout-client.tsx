"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, Check, Copy, Heart, Hourglass, Loader2, Lock } from "lucide-react";
import { createPixTransactionAction, checkTransactionStatusAction, processCardPaymentAction } from "@/actions/payment-actions";
import { Field, FormAlert, maskPhone } from "@/app/login/fields";
import { Seal } from "@/components/landing/seal";
import { btn, btnArrow } from "@/components/landing/styles";
import { UserImage } from "@/components/ui/user-image";
import { tokenizeCard } from "@/lib/mercadopago-client";
import { weddingSitePath } from "@/lib/wedding-links";
import { GiftLocal as Gift } from "@/types/local";
import { cn } from "@/lib/utils";

interface CheckoutClientProps {
  gift: Gift;
  coupleNames: string;
  /** Casamento do presente (/casamento/<slug>) */
  slug: string;
  /** Falso quando o cartão não está disponível: só o Pix é oferecido. */
  cardEnabled?: boolean;
}

type CheckoutStep = "IDENTIFICATION" | "METHOD" | "PAYMENT" | "SUCCESS";
type PaymentMethod = "PIX" | "CREDIT_CARD";

export function CheckoutClient({ gift, coupleNames, slug, cardEnabled = true }: CheckoutClientProps) {
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
  const [copyFailed, setCopyFailed] = useState(false);
  // Pix estático: o casal confere no extrato, não há confirmação automática.
  const [staticPix, setStaticPix] = useState(false);
  const [pixAcknowledged, setPixAcknowledged] = useState(false);

  // Dados do Cartão
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
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

  function handleIdentificationNext(e: React.FormEvent) {
    e.preventDefault();
    if (guestName.length < 3 || guestPhone.replace(/\D/g, "").length < 10) {
      setError("Confira o nome completo e o WhatsApp com DDD para continuar.");
      return;
    }
    setError(null);
    setStep("METHOD");
  }

  function handleProcessPayment() {
    setError(null);

    startTransition(async () => {
      if (method === "PIX") {
        const result = await createPixTransactionAction({
          giftId: gift.id,
          guestName,
          guestPhone,
        });

        if (result.success && result.pixPayload) {
          setPixPayload(result.pixPayload);
          setStaticPix(!("isDynamicMp" in result && result.isDynamicMp));
          setTransactionId(result.transactionId || null);
          setStep("PAYMENT");
        } else {
          setError(result.error ?? "Erro ao gerar o Pix.");
        }
      } else {
        if (!payerEmail || !cardNumber || !cardName || !cardExpiry || !cardCvv) {
          setError("Preencha todos os campos do cartão.");
          return;
        }

        // Os dados do cartão vão direto para o Mercado Pago; o servidor recebe só o token.
        let card: { token: string; paymentMethodId: string };
        try {
          card = await tokenizeCard({ cardNumber, cardholderName: cardName, cardExpiry, securityCode: cardCvv });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Não foi possível validar o cartão.";
          setError(message);
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
          setTransactionId(result.transactionId || null);
          setStep("PAYMENT");
        } else if (result.success) {
          setStep("SUCCESS");
        } else {
          setError(result.error ?? "Erro ao processar o pagamento.");
        }
      }
    });
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch {
      // Sem permissão para copiar (alguns navegadores): mostra o código para copiar à mão.
      setCopyFailed(true);
    }
  }

  // Ao trocar de etapa o foco vai para o título: quem usa leitor de tela ouve a nova etapa.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const overline = "text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave";
  const heading = "font-display text-[30px] font-normal leading-[36px] tracking-[-0.015em] text-tinta outline-none";
  const selectClass =
    "block min-h-12 w-full cursor-pointer rounded-[12px] border border-linha-forte bg-papel px-4 text-base leading-6 text-tinta transition-[border-color,box-shadow] duration-200 hover:border-tinta-suave focus:border-ameixa focus:shadow-[0_0_0_3px_var(--color-ameixa-suave)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa";

  const methodOptions: { id: PaymentMethod; label: string; hint: string; value: string }[] = [
    { id: "PIX", label: "Pix", hint: "À vista, sem juros", value: formatPrice(gift.amount) },
    ...(cardEnabled
      ? [{ id: "CREDIT_CARD" as const, label: "Cartão", hint: "Em até 12x, com juros do cartão", value: formatPrice(cardFinalAmount) }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Resumo do presente */}
      <div className="flex items-center gap-3 rounded-[16px] border border-linha bg-papel p-3 shadow-[var(--shadow-aceito-1)]">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-[12px] bg-areia">
          {gift.imageUrl ? <UserImage src={gift.imageUrl} alt="" sizes="56px" className="object-cover" /> : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <strong className="font-semibold leading-6">{gift.title}</strong>
          <span className="truncate text-sm leading-5 text-tinta-suave">Para {coupleNames}</span>
        </div>
        <span className="font-display text-2xl leading-8 tabular-nums">{formatPrice(gift.amount)}</span>
      </div>

      {/* PASSO 1: IDENTIFICAÇÃO */}
      {step === "IDENTIFICATION" && (
        <form onSubmit={handleIdentificationNext} noValidate className="step-in flex flex-col gap-5 pt-2">
          <div className="flex flex-col gap-2">
            <p className={overline}>Passo 1 de 3</p>
            <h2 ref={headingRef} tabIndex={-1} className={heading}>
              Quem está presenteando?
            </h2>
            <p className="text-tinta-suave">Para os noivos saberem quem presenteou.</p>
          </div>

          <Field id="checkout-nome" label="Seu nome completo">
            {(c) => (
              <input
                {...c}
                id="checkout-nome"
                name="name"
                autoComplete="name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Como os noivos conhecem você"
                required
              />
            )}
          </Field>

          <Field id="checkout-telefone" label="Seu WhatsApp com DDD">
            {(c) => (
              <input
                {...c}
                id="checkout-telefone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={guestPhone}
                onChange={(e) => setGuestPhone(maskPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                required
              />
            )}
          </Field>

          {error ? <FormAlert>{error}</FormAlert> : null}

          <button type="submit" className={cn(btn.primary, btn.block, "min-h-12")}>
            Continuar para o pagamento
            <ArrowRight aria-hidden="true" className={btnArrow} />
          </button>
        </form>
      )}

      {/* PASSO 2: FORMA DE PAGAMENTO E DADOS DO CARTÃO */}
      {step === "METHOD" && (
        <div className="step-in flex flex-col gap-5 pt-2">
          <div className="flex flex-col gap-2">
            <p className={overline}>Passo 2 de 3</p>
            <h2 ref={headingRef} tabIndex={-1} className={heading}>
              Forma de pagamento
            </h2>
            <p className="text-tinta-suave">{cardEnabled ? "Escolha como prefere pagar." : "O pagamento é por Pix."}</p>
          </div>

          <div className={cn("grid grid-cols-1 gap-2", cardEnabled && "min-[420px]:grid-cols-2")} role="radiogroup" aria-label="Forma de pagamento">
            {methodOptions.map((opt) => {
              const selected = method === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setMethod(opt.id)}
                  className={cn(
                    "flex min-h-16 cursor-pointer flex-col gap-0.5 rounded-[12px] p-3 text-left transition-[border-color,background-color] duration-200",
                    selected ? "border-2 border-ameixa bg-ameixa-suave p-[11px]" : "border border-linha-forte bg-papel hover:border-tinta-suave",
                  )}
                >
                  <span className="flex items-center gap-2 font-semibold text-tinta">
                    <span
                      aria-hidden="true"
                      className={cn("grid size-4 shrink-0 place-items-center rounded-full border", selected ? "border-ameixa" : "border-linha-forte")}
                    >
                      {selected ? <span className="size-2 rounded-full bg-ameixa" /> : null}
                    </span>
                    {opt.label}
                  </span>
                  <span className="text-sm leading-5 text-tinta-suave">{opt.hint}</span>
                  <span className="text-base font-semibold tabular-nums text-tinta">{opt.value}</span>
                </button>
              );
            })}
          </div>

          {method === "CREDIT_CARD" && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-4">
              <Field id="cartao-email" label="E-mail para o comprovante" className="col-span-2">
                {(c) => (
                  <input
                    {...c}
                    id="cartao-email"
                    type="email"
                    autoComplete="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder="voce@email.com"
                  />
                )}
              </Field>

              <Field id="cartao-nome" label="Nome como está no cartão" className="col-span-2">
                {(c) => (
                  <input
                    {...c}
                    id="cartao-nome"
                    autoComplete="cc-name"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    placeholder="JOAO M SILVA"
                  />
                )}
              </Field>

              <Field id="cartao-numero" label="Número do cartão" className="col-span-2">
                {(c) => (
                  <input
                    {...c}
                    id="cartao-numero"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ")}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").substring(0, 16))}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className={cn(c.className, "font-mono tracking-wider")}
                  />
                )}
              </Field>

              <Field id="cartao-validade" label="Validade (MM/AA)">
                {(c) => (
                  <input
                    {...c}
                    id="cartao-validade"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={cardExpiry}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").substring(0, 4);
                      setCardExpiry(raw.length >= 3 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw);
                    }}
                    placeholder="MM/AA"
                    maxLength={5}
                    className={cn(c.className, "font-mono")}
                  />
                )}
              </Field>

              <Field id="cartao-cvv" label="Código (CVV)">
                {(c) => (
                  <input
                    {...c}
                    id="cartao-cvv"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").substring(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    className={cn(c.className, "font-mono")}
                  />
                )}
              </Field>

              {/* Parcelas (máx. 12x) */}
              <div className="col-span-2 flex flex-col gap-2">
                <label htmlFor="cartao-parcelas" className="text-sm font-semibold leading-5 text-tinta">
                  Parcelas
                </label>
                <select
                  id="cartao-parcelas"
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className={selectClass}
                >
                  {[...Array(12)].map((_, i) => {
                    const count = i + 1;
                    return (
                      <option key={count} value={count}>
                        {count}x de {formatPrice(Math.round(cardFinalAmount / count))}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}

          {error ? <FormAlert>{error}</FormAlert> : null}

          <div className="flex flex-col gap-2">
            <button type="button" onClick={handleProcessPayment} disabled={isPending} className={cn(btn.primary, btn.block, "min-h-12")}>
              {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              {isPending ? (method === "PIX" ? "Gerando o Pix…" : "Processando o pagamento…") : method === "PIX" ? "Gerar Pix" : "Pagar com cartão"}
            </button>
            <button type="button" onClick={() => setStep("IDENTIFICATION")} className={cn(btn.quiet, btn.block)}>
              Voltar
            </button>
          </div>
        </div>
      )}

      {/* PASSO 3: PIX */}
      {step === "PAYMENT" && method === "PIX" && (
        <div className="step-in flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-2">
            <p className={overline}>Passo 3 de 3</p>
            <h2 ref={headingRef} tabIndex={-1} className={heading}>
              Faça o Pix
            </h2>
          </div>

          <section aria-label="Pix" className="flex flex-col items-center gap-3 rounded-[16px] border border-linha bg-papel p-6 text-center shadow-[var(--shadow-aceito-1)]">
            <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-aviso-suave px-3 text-sm font-semibold text-aviso">
              <Hourglass aria-hidden="true" className="size-4" strokeWidth={2} />
              Aguardando pagamento
            </span>
            <div className="rounded-[12px] border border-linha bg-papel p-3">
              <QRCodeSVG value={pixPayload} size={200} role="img" aria-label="QR Code do Pix" />
            </div>
            <p className="text-sm text-tinta-suave">
              No celular, copie o código e cole no app do seu banco, na opção Pix copia e cola. No computador, escaneie o QR Code com o celular.
            </p>
            <div className="flex w-full items-center gap-2 rounded-[12px] border border-linha-forte py-2 pl-3 pr-2">
              <code className="min-w-0 flex-1 truncate text-left font-mono text-sm">{pixPayload}</code>
              <button
                type="button"
                onClick={copyToClipboard}
                aria-label={copied ? "Código copiado" : "Copiar código Pix"}
                className={cn(btn.primary, btn.sm, "shrink-0")}
              >
                {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="min-h-5 text-sm font-semibold text-sucesso" role="status" aria-live="polite">
              {copied ? "Agora é só colar no app do seu banco." : ""}
            </p>

            {copyFailed && (
              <div className="flex w-full flex-col gap-2 text-left">
                <label htmlFor="checkout-pix-codigo" className="text-sm font-semibold text-tinta">
                  Não deu para copiar sozinho. Selecione o código e copie:
                </label>
                <textarea
                  id="checkout-pix-codigo"
                  readOnly
                  value={pixPayload}
                  rows={4}
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full resize-none rounded-[12px] border border-linha-forte bg-papel p-3 font-mono text-xs text-tinta"
                />
              </div>
            )}
          </section>

          {staticPix ? (
            <div className="flex flex-col gap-3 rounded-[16px] border border-linha bg-areia p-4 text-sm text-tinta">
              <div>
                <p className="font-semibold">Depois de pagar, é só avisar aqui.</p>
                <p className="mt-1 text-tinta-suave">
                  Os noivos conferem o Pix no extrato e confirmam o presente. Não precisa esperar nesta tela.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPixAcknowledged(true);
                  setStep("SUCCESS");
                }}
                className={cn(btn.primary, btn.block, "min-h-12")}
              >
                Já fiz o Pix
              </button>
            </div>
          ) : (
            <p className="flex gap-2 text-sm text-tinta-suave">
              <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
              Quando o pagamento cair, esta tela muda sozinha e os noivos são avisados.
            </p>
          )}

          <button type="button" onClick={() => setStep("METHOD")} className={cn(btn.quiet, "self-start")}>
            Voltar
          </button>
        </div>
      )}

      {/* PASSO 3: CARTÃO EM ANÁLISE */}
      {step === "PAYMENT" && method === "CREDIT_CARD" && (
        <div className="step-in flex flex-col items-center gap-4 rounded-[16px] border border-linha bg-papel px-6 py-10 text-center shadow-[var(--shadow-aceito-1)]">
          <Loader2 aria-hidden="true" className="size-8 animate-spin text-ameixa" />
          <h2 ref={headingRef} tabIndex={-1} className={heading}>
            Pagamento em análise
          </h2>
          <p className="max-w-[34ch] text-tinta-suave">
            O banco está analisando o seu pagamento. Esta página será atualizada automaticamente assim que ele for aprovado.
          </p>
        </div>
      )}

      {/* SUCESSO */}
      {step === "SUCCESS" && (
        <div className="step-in flex flex-col items-center gap-4 pt-6 text-center">
          {/* O selo só marca pagamento concluído: com Pix avisado, ainda falta o casal conferir */}
          {pixAcknowledged ? (
            <span aria-hidden="true" className="grid size-24 place-items-center rounded-full bg-ameixa-suave text-ameixa">
              <Heart className="size-10" strokeWidth={1.5} />
            </span>
          ) : (
            <Seal label="Selo de pagamento" className="size-24 [&>span]:text-[54px]" />
          )}
          <h2 ref={headingRef} tabIndex={-1} className="mt-2 font-display text-[40px] font-normal leading-[46px] tracking-[-0.015em] text-tinta outline-none">
            Obrigado pelo carinho!
          </h2>
          <p className="max-w-[34ch] text-tinta-suave">
            {pixAcknowledged
              ? `${coupleNames} já foram avisados do seu Pix e confirmam o presente assim que ele aparecer no extrato.`
              : `Seu presente foi confirmado e ${coupleNames} já foram avisados.`}
          </p>

          <div className="flex w-full flex-col items-center gap-1 rounded-[16px] border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)]">
            <span className={overline}>{pixAcknowledged ? "Valor do Pix" : "Valor do presente"}</span>
            <span className="font-display text-[44px] leading-[48px] tabular-nums text-tinta">{formatPrice(gift.amount)}</span>
          </div>

          <div className="mt-2 flex w-full flex-col gap-2">
            <Link href={weddingSitePath(slug, "rsvp")} className={cn(btn.primary, btn.block, "min-h-12")}>
              Confirmar presença
            </Link>
            <Link href={weddingSitePath(slug)} className={cn(btn.secondary, btn.block, "min-h-12")}>
              Ver o site do casal
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
