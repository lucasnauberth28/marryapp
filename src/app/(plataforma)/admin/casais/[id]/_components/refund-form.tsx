"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestWeddingRefund } from "@/actions/admin-casais-actions";
import { btn } from "@/components/landing/styles";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCasalAction } from "../../_components/use-casal-action";

export interface RefundOption {
  id: string;
  label: string;
  amountCents: number;
}

/** Converte "149,00" ou "149.5" em centavos (null se não for um valor). */
function toCents(text: string): number | null {
  const clean = text.trim().replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

/** Registra o pedido de reembolso de um pagamento. O estorno é feito no painel do Mercado Pago; a decisão fica em Planos e receita. */
export function RefundForm({ weddingId, options }: { weddingId: string; options: RefundOption[] }) {
  const router = useRouter();
  const [subId, setSubId] = useState(options[0]?.id ?? "");
  const [amount, setAmount] = useState(options[0] ? (options[0].amountCents / 100).toFixed(2).replace(".", ",") : "");
  const [reason, setReason] = useState("");
  const { pending, error, run } = useCasalAction();
  const cents = toCents(amount);

  if (options.length === 0) return <p className="text-sm leading-5 text-tinta-suave">Não há pagamento recebido sem pedido de reembolso aberto.</p>;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (cents === null) return;
        run(() => requestWeddingRefund({ weddingId, subscriptionId: subId, amountCents: cents, reason }), () => {
          setReason("");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <NativeSelect
          label="Pagamento"
          value={subId}
          onChange={(e) => {
            setSubId(e.target.value);
            const opt = options.find((o) => o.id === e.target.value);
            if (opt) setAmount((opt.amountCents / 100).toFixed(2).replace(".", ","));
          }}
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
        <Input label="Valor a devolver (R$)" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
      </div>
      <Textarea label="Motivo (obrigatório)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={3} />
      <p className="text-sm leading-5 text-tinta-suave">O pedido fica registrado e aparece em Planos e receita para decidir. O estorno em si é feito no painel do Mercado Pago.</p>
      {error && (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      )}
      <div>
        <button type="submit" disabled={pending || cents === null || reason.trim().length < 5} className={btn.secondary}>
          {pending ? "Registrando..." : "Registrar pedido de reembolso"}
        </button>
      </div>
    </form>
  );
}
