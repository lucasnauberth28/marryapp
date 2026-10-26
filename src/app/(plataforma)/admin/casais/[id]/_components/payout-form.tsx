"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { registrarRepasseDoCasamento } from "@/actions/casais-admin/repasse";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";
import { reaisParaCentavos } from "@/lib/formatacao/dinheiro";
import { useAcaoDoCasal } from "../../_components/use-casal-action";

const paraCampoDeValor = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

/** Registra um repasse que a equipe já fez no banco. Não move dinheiro: só anota e baixa do que falta repassar. */
export function FormularioDeRepasse({ weddingId, dueCents }: { weddingId: string; dueCents: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(paraCampoDeValor(dueCents));
  const [reference, setReference] = useState("");
  const { pending, error, run } = useAcaoDoCasal();
  const cents = reaisParaCentavos(amount);
  const valido = cents !== null && cents > 0 && cents <= dueCents;

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    run(() => registrarRepasseDoCasamento({ weddingId, amountCents: cents, reference }), () => {
      setReference("");
      router.refresh();
    });
  };

  return (
    <form className="flex flex-col gap-4 border-t border-linha pt-5" onSubmit={enviar}>
      <p className="text-sm leading-5 text-tinta-suave">Depois de transferir pelo banco, registre aqui o valor. O Aceito não envia dinheiro sozinho.</p>
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <Entrada label="Valor repassado (R$)" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        <Entrada label="Referência do comprovante (opcional)" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={120} />
      </div>
      {cents !== null && cents > dueCents ? <p className="text-sm font-semibold text-perigo">O valor passa do que falta repassar.</p> : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      ) : null}
      <div>
        <Botao type="submit" disabled={!valido} loading={pending}>
          Registrar repasse
        </Botao>
      </div>
    </form>
  );
}
