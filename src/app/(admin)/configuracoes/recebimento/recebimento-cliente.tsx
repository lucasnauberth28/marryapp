"use client";
// Onde o casal recebe os presentes: ver, cadastrar, trocar, confirmar e remover o destino do repasse.
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { RespostaDoRepasse } from "@/actions/payout-actions";
import { ComoFunciona } from "./componentes/como-funciona";
import { DestinoCadastrado } from "./componentes/destino-cadastrado";
import { FormularioDeRepasse } from "./componentes/formulario-de-repasse";
import { SemDestinoParaCadastrar, SemDestinoSomenteLeitura } from "./componentes/sem-destino";
import type { MascaraDaConta, ModoDoRecebimento } from "./componentes/tipos";

interface Propriedades {
  account: MascaraDaConta | null;
  /** Motivo de a pessoa só poder olhar (administração vendo o casal, casamento suspenso), ou null. */
  blockedReason: string | null;
  registrationAvailable: boolean;
  feeLabel: string;
}

export function RecebimentoCliente({ account: initial, blockedReason, registrationAvailable, feeLabel }: Propriedades) {
  const [account, setAccount] = useState<MascaraDaConta | null>(initial);
  const [mode, setMode] = useState<ModoDoRecebimento>("view");
  const readOnly = blockedReason !== null;

  function applyResult(res: RespostaDoRepasse, success: string): boolean {
    if (!res.success) return false;
    const conta = res.account;
    setAccount(conta ? { ...conta, verifiedAt: conta.verifiedAt ? new Date(conta.verifiedAt).toISOString() : null, updatedAt: new Date(conta.updatedAt).toISOString() } : null);
    setMode("view");
    toast.success(success);
    return true;
  }

  return (
    <>
      <ComoFunciona feeLabel={feeLabel} />
      {readOnly && (
        <p role="status" className="rounded-2xl border border-aviso/40 bg-aviso-suave px-4 py-3.5 text-sm leading-5 text-tinta">
          {blockedReason}
        </p>
      )}
      {account && mode !== "form" && (
        <DestinoCadastrado account={account} mode={mode} readOnly={readOnly} registrationAvailable={registrationAvailable} aoMudarModo={setMode} aoConcluir={applyResult} />
      )}
      {!account && !readOnly && mode === "view" && <SemDestinoParaCadastrar registrationAvailable={registrationAvailable} aoCadastrar={() => setMode("form")} />}
      {!account && readOnly && <SemDestinoSomenteLeitura />}
      {mode === "form" && !readOnly && (
        <FormularioDeRepasse
          replacing={Boolean(account)}
          onCancel={() => setMode("view")}
          onSaved={(res) => applyResult(res, account ? "Dados trocados. Falta confirmar que estão certos." : "Dados cadastrados. Falta confirmar que estão certos.")}
        />
      )}
      <p className="text-sm leading-5 text-tinta-suave">
        Quer entender a taxa e os planos? Veja em{" "}
        <Link href="/plano" className="font-semibold text-ameixa underline underline-offset-4">
          Plano e pagamentos
        </Link>
        .
      </p>
    </>
  );
}
