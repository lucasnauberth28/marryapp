"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { solicitarReembolsoDoCasamento } from "@/actions/admin-casais-actions";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";
import { SelecaoNativa } from "@/components/ui/select";
import { AreaDeTexto } from "@/components/ui/textarea";
import { useAcaoDoCasal } from "../../_components/use-casal-action";

export interface OpcaoDeReembolso {
  id: string;
  label: string;
  amountCents: number;
}

/** Converte "149,00" ou "149.5" em centavos (null se não for um valor). */
function paraCentavos(text: string): number | null {
  const clean = text.trim().replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

const paraCampoDeValor = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

interface PropriedadesDosCampos {
  options: OpcaoDeReembolso[];
  subId: string;
  amount: string;
  reason: string;
  aoEscolher: (id: string) => void;
  aoMudarValor: (v: string) => void;
  aoMudarMotivo: (v: string) => void;
}

function CamposDoReembolso({ options, subId, amount, reason, aoEscolher, aoMudarValor, aoMudarMotivo }: PropriedadesDosCampos) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <SelecaoNativa label="Pagamento" value={subId} onChange={(e) => aoEscolher(e.target.value)}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </SelecaoNativa>
        <Entrada label="Valor a devolver (R$)" value={amount} onChange={(e) => aoMudarValor(e.target.value)} inputMode="decimal" />
      </div>
      <AreaDeTexto label="Motivo (obrigatório)" value={reason} onChange={(e) => aoMudarMotivo(e.target.value)} maxLength={500} rows={3} />
    </>
  );
}

/** Registra o pedido de reembolso de um pagamento. O estorno é feito no painel do Mercado Pago; a decisão fica em Planos e receita. */
export function FormularioDeReembolso({ weddingId, options }: { weddingId: string; options: OpcaoDeReembolso[] }) {
  const router = useRouter();
  const [subId, setSubId] = useState(options[0]?.id ?? "");
  const [amount, setAmount] = useState(options[0] ? paraCampoDeValor(options[0].amountCents) : "");
  const [reason, setReason] = useState("");
  const { pending, error, run } = useAcaoDoCasal();
  const cents = paraCentavos(amount);

  if (options.length === 0) return <p className="text-sm leading-5 text-tinta-suave">Não há pagamento recebido sem pedido de reembolso aberto.</p>;

  const escolher = (id: string) => {
    setSubId(id);
    const opt = options.find((o) => o.id === id);
    if (opt) setAmount(paraCampoDeValor(opt.amountCents));
  };
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (cents === null) return;
    run(() => solicitarReembolsoDoCasamento({ weddingId, subscriptionId: subId, amountCents: cents, reason }), () => {
      setReason("");
      router.refresh();
    });
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={enviar}>
      <CamposDoReembolso options={options} subId={subId} amount={amount} reason={reason} aoEscolher={escolher} aoMudarValor={setAmount} aoMudarMotivo={setReason} />
      <p className="text-sm leading-5 text-tinta-suave">O pedido fica registrado e aparece em Planos e receita para decidir. O estorno em si é feito no painel do Mercado Pago.</p>
      {error && (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      )}
      <div>
        <Botao type="submit" variant="outline" disabled={cents === null || reason.trim().length < 5} loading={pending}>
          Registrar pedido de reembolso
        </Botao>
      </div>
    </form>
  );
}
