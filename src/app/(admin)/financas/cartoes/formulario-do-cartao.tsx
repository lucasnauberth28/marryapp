"use client";

import { useState, useTransition } from "react";
import { atualizarCartaoDeCredito, criarCartaoDeCredito } from "@/actions/wallet-actions";
import { estiloDoBotao } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { AvisoDoFormulario } from "@/components/ui/field";
import { Entrada } from "@/components/ui/input";
import { SelecaoNativa } from "@/components/ui/select";
import { BANDEIRAS_DE_CARTAO, CORES_DE_CARTAO } from "@/lib/financas/cartoes";
import { reaisParaCentavos } from "@/lib/formatacao/dinheiro";
import { cn } from "@/lib/utils";
import type { CartaoCadastrado } from "./tipos";

const emReais = (centavos: number) => (centavos / 100).toFixed(2).replace(".", ",");

function useFormularioDoCartao(cartao: CartaoCadastrado | null, aoConcluir: () => void) {
  const [bank, setBank] = useState(cartao?.bank ?? "");
  const [brand, setBrand] = useState(cartao?.brand ?? "");
  const [nickname, setNickname] = useState(cartao?.nickname ?? "");
  const [lastDigits, setLastDigits] = useState(cartao?.lastDigits ?? "");
  const [limit, setLimit] = useState(cartao ? emReais(cartao.limit) : "");
  const [color, setColor] = useState(cartao?.color ?? CORES_DE_CARTAO[0]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const limitCents = limit.trim() === "" ? 0 : reaisParaCentavos(limit);
    if (limitCents === null) return setError("Informe o limite em reais, por exemplo 5.000,00.");
    const dados = { bank, brand, nickname, lastDigits, limitCents, color };
    startTransition(async () => {
      const res = cartao ? await atualizarCartaoDeCredito(cartao.id, dados) : await criarCartaoDeCredito(dados);
      if (res.success) aoConcluir();
      else setError(res.error);
    });
  };

  return { bank, setBank, brand, setBrand, nickname, setNickname, lastDigits, setLastDigits, limit, setLimit, color, setColor, error, isPending, salvar };
}

function EscolhaDaCor({ valor, aoEscolher }: { valor: string; aoEscolher: (cor: string) => void }) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="mb-1 text-sm text-tinta-suave">Cor na lista</legend>
      {CORES_DE_CARTAO.map((cor) => (
        <label key={cor} className="relative cursor-pointer">
          <input type="radio" name="cor-do-cartao" value={cor} checked={valor === cor} onChange={() => aoEscolher(cor)} className="peer sr-only" />
          <span aria-hidden="true" style={{ backgroundColor: cor }} className="block size-9 rounded-full border-2 border-papel ring-1 ring-linha-forte peer-checked:ring-2 peer-checked:ring-ameixa peer-focus-visible:ring-2 peer-focus-visible:ring-ameixa" />
          <span className="sr-only">{cor}</span>
        </label>
      ))}
    </fieldset>
  );
}

/** Cadastro e edição de um cartão. Sem número completo nem CVV: só o que ajuda a reconhecer o cartão nas despesas. */
export function FormularioDoCartao({ cartao, aoConcluir, aoCancelar }: { cartao: CartaoCadastrado | null; aoConcluir: () => void; aoCancelar: () => void }) {
  const f = useFormularioDoCartao(cartao, aoConcluir);
  return (
    <form onSubmit={f.salvar} noValidate className="step-in flex flex-col gap-4 rounded-2xl border border-linha bg-papel p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Entrada label="Banco ou emissor" value={f.bank} onChange={(e) => f.setBank(e.target.value)} maxLength={40} autoComplete="off" />
        <SelecaoNativa label="Bandeira" value={f.brand} onChange={(e) => f.setBrand(e.target.value)}>
          <option value="">Escolher</option>
          {BANDEIRAS_DE_CARTAO.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </SelecaoNativa>
        <Entrada label="Apelido" optional value={f.nickname} onChange={(e) => f.setNickname(e.target.value)} maxLength={30} hint="Ex.: da viagem, do buffet." />
        <Entrada label="4 últimos dígitos" optional value={f.lastDigits} onChange={(e) => f.setLastDigits(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" autoComplete="off" hint="Só os 4 últimos. Nunca peça o número inteiro." />
        <Entrada label="Limite (R$)" optional value={f.limit} onChange={(e) => f.setLimit(e.target.value)} inputMode="decimal" autoComplete="off" />
      </div>
      <EscolhaDaCor valor={f.color} aoEscolher={f.setColor} />
      {f.error ? <AvisoDoFormulario>{f.error}</AvisoDoFormulario> : null}
      <div className="flex flex-wrap gap-3">
        <Botao type="submit" loading={f.isPending}>
          {cartao ? "Salvar o cartão" : "Adicionar o cartão"}
        </Botao>
        <button type="button" onClick={aoCancelar} className={cn(estiloDoBotao.quiet, "min-h-11")}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
