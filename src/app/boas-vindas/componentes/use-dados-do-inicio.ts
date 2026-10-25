// O estado da tela de boas-vindas: nomes e data, validação por campo e a criação do casamento.
import { useState, useTransition } from "react";
import { concluirInicio } from "@/actions/inicio/concluir";
import { juntarNomesDoCasal, validarDadosBasicosDoInicio, type ErrosDosDadosBasicosDoInicio } from "@/lib/painel/onboarding-options";

export type Etapa = "dados" | "pronto";
export type Resultado = { slug: string; coupleNames: string };

export interface ValoresIniciais {
  yourName: string;
  partnerName: string;
  weddingDate: string | null;
}

/** Leva o foco ao primeiro campo com erro; devolve se havia algum. */
function focarPrimeiroErro(found: ErrosDosDadosBasicosDoInicio) {
  const first = (["yourName", "partnerName", "weddingDate"] as const).find((k) => found[k]);
  if (first) document.getElementById(`onb-${first}`)?.focus();
  return Boolean(first);
}

export function useDadosDoInicio(initial: ValoresIniciais, done: Resultado | null) {
  const [step, setStep] = useState<Etapa>(done ? "pronto" : "dados");
  const [yourName, setYourName] = useState(initial.yourName);
  const [partnerName, setPartnerName] = useState(initial.partnerName);
  const [weddingDate, setWeddingDate] = useState(initial.weddingDate ?? "");
  const [errors, setErrors] = useState<ErrosDosDadosBasicosDoInicio>({});
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<Resultado | null>(done);

  // O erro some assim que a pessoa mexe no campo a que ele se refere.
  const edit = (key: keyof ErrosDosDadosBasicosDoInicio, set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set(e.target.value);
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const found = validarDadosBasicosDoInicio({ yourName, partnerName, weddingDate });
    setErrors(found);
    if (focarPrimeiroErro(found)) return;

    startTransition(async () => {
      const res = await concluirInicio({ yourName, partnerName, weddingDate: weddingDate || null });
      if (res.success) {
        setResult({ slug: res.slug, coupleNames: res.coupleNames });
        setStep("pronto");
      } else if (res.redirectTo) window.location.href = res.redirectTo;
      else setFormError(res.error);
    });
  };

  return {
    step,
    result,
    errors,
    formError,
    isPending,
    submit,
    yourName,
    partnerName,
    weddingDate,
    coupleNames: juntarNomesDoCasal(yourName, partnerName) || "Vocês dois",
    editarSeuNome: edit("yourName", setYourName),
    editarNomeDoParceiro: edit("partnerName", setPartnerName),
    editarData: edit("weddingDate", setWeddingDate),
  };
}

export type DadosDoInicio = ReturnType<typeof useDadosDoInicio>;
