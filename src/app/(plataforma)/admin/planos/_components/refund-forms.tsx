"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { decidirReembolso, registrarPedidoDeReembolso, type ResultadoDaAcaoDePlanos } from "@/actions/admin-planos-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { formatarReais } from "@/lib/formatacao/dinheiro";
function useRun() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (action: () => Promise<ResultadoDaAcaoDePlanos>, after?: () => void) => {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        if (res.message) toast.success(res.message);
        after?.();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };
  return { pending, error, run };
}

/** Decisão sobre um pedido de reembolso: aprovar (e estornar no Mercado Pago) ou recusar, sempre com a nota. */
export function RefundDecision({ refundId, payer }: { refundId: string; payer: string }) {
  const { pending, error, run } = useRun();
  const [open, setOpen] = useState<"approve" | "deny" | null>(null);
  const [note, setNote] = useState("");
  return (
    <div className="flex flex-col gap-3">
      {open ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => decidirReembolso({ refundId, decision: open, note }), () => setOpen(null));
          }}
        >
          {open === "approve" ? (
            <p className="text-sm text-tinta">
              Ao aprovar, o Aceito só registra a decisão. Depois, abra o pagamento no painel do Mercado Pago e faça o estorno: quando o aviso do Mercado Pago chegar, o pedido e o pagamento ficam como estornados.
            </p>
          ) : null}
          <Textarea label={open === "approve" ? "Anotação da aprovação" : "Motivo da recusa"} rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} error={error ?? undefined} hint="Fica no registro de atividades." />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={note.trim().length < 5} loading={pending}>
              {open === "approve" ? "Aprovar reembolso" : "Recusar pedido"}
            </Button>
            <Button type="button" variant="quiet" size="sm" onClick={() => setOpen(null)} disabled={pending}>
              Voltar
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen("approve")}>
            Aprovar
            <span className="sr-only"> o reembolso de {payer}</span>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen("deny")}>
            Recusar
            <span className="sr-only"> o reembolso de {payer}</span>
          </Button>
        </div>
      )}
    </div>
  );
}


/** Registrar um pedido de reembolso que chegou por WhatsApp ou e-mail. */
export function RegisterRefundForm({ payments }: { payments: { id: string; label: string; amount: number }[] }) {
  const { pending, error, run } = useRun();
  const [subscriptionId, setSubscriptionId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const chosen = payments.find((p) => p.id === subscriptionId);

  if (payments.length === 0) {
    return <p className="text-sm text-tinta-suave">Quando houver pagamentos aprovados, você pode registrar aqui um pedido de reembolso que chegou por WhatsApp ou e-mail.</p>;
  }

  const toCents = (text: string) => {
    const clean = text.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    const n = Number(clean);
    return Number.isFinite(n) ? Math.round(n * 100) : Number.NaN;
  };

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => registrarPedidoDeReembolso({ subscriptionId, amountCents: toCents(amount), reason }), () => {
          setSubscriptionId("");
          setAmount("");
          setReason("");
        });
      }}
    >
      <NativeSelect
        label="Pagamento"
        alwaysFloat
        value={subscriptionId}
        onChange={(e) => {
          setSubscriptionId(e.target.value);
          const p = payments.find((x) => x.id === e.target.value);
          if (p) setAmount((p.amount / 100).toFixed(2).replace(".", ","));
        }}
        required
      >
        <option value="">Escolha o pagamento</option>
        {payments.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label} · {formatarReais(p.amount)}
          </option>
        ))}
      </NativeSelect>
      <Input label="Valor a devolver (R$)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} hint={chosen ? `Pago: ${formatarReais(chosen.amount)}` : undefined} required />
      <div className="md:col-span-2">
        <Textarea label="Motivo do pedido" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} error={error ?? undefined} required />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" variant="outline" disabled={!subscriptionId || reason.trim().length < 5} loading={pending}>
          Registrar pedido
        </Button>
      </div>
    </form>
  );
}
