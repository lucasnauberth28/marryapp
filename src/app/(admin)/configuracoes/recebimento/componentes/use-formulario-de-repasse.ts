// Os campos do cadastro do destino (Pix ou conta bancária) e o envio com a senha.
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { salvarContaDeRepasse, type RespostaDoRepasse } from "@/actions/payout-actions";
import type { TipoDeChavePix, TipoDeContaBancaria } from "@/lib/payout-input";

export interface CamposDoRepasse {
  kind: "PIX_KEY" | "BANK_ACCOUNT";
  holderName: string;
  holderDocument: string;
  pixKeyType: TipoDeChavePix;
  pixKey: string;
  bankCode: string;
  agency: string;
  account: string;
  accountDigit: string;
  accountKind: TipoDeContaBancaria;
  password: string;
}

const CAMPOS_INICIAIS: CamposDoRepasse = {
  kind: "PIX_KEY", holderName: "", holderDocument: "", pixKeyType: "CPF", pixKey: "",
  bankCode: "", agency: "", account: "", accountDigit: "", accountKind: "CORRENTE", password: "",
};

function dadosParaEnviar(c: CamposDoRepasse) {
  const comuns = { holderName: c.holderName, holderDocument: c.holderDocument, password: c.password };
  return c.kind === "PIX_KEY"
    ? { type: "PIX_KEY", ...comuns, pixKeyType: c.pixKeyType, pixKey: c.pixKey }
    : { type: "BANK_ACCOUNT", ...comuns, bankCode: c.bankCode, agency: c.agency, account: c.account, accountDigit: c.accountDigit, accountKind: c.accountKind };
}

export function useFormularioDeRepasse(onSaved: (res: RespostaDoRepasse) => boolean) {
  const [campos, setCampos] = useState(CAMPOS_INICIAIS);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const mudar = <C extends keyof CamposDoRepasse>(campo: C, valor: CamposDoRepasse[C]) => setCampos((c) => ({ ...c, [campo]: valor }));

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const toastId = toast.loading("Salvando…");
    startTransition(async () => {
      const res = await salvarContaDeRepasse(dadosParaEnviar(campos));
      toast.dismiss(toastId);
      if (!res.success) {
        setCampos((c) => ({ ...c, password: "" }));
        return setError(res.error);
      }
      // Limpa o que foi digitado: o navegador não precisa guardar o dado depois de salvo.
      setCampos((c) => ({ ...c, password: "", pixKey: "", holderDocument: "", account: "", accountDigit: "" }));
      onSaved(res);
    });
  }

  return { campos, mudar, error, pending, submit };
}

export type FormularioDeRepasseEmEdicao = ReturnType<typeof useFormularioDeRepasse>;
