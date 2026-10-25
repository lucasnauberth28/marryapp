// O estado da tela de boas-vindas: nomes e data, validação por campo e a criação do casamento.
import { useState, useTransition } from "react";
import type { IdDoModelo } from "@/components/public/site-do-casamento/modelos/catalogo";
import { concluirInicio } from "@/actions/inicio/concluir";
import { juntarNomesDoCasal, validarDadosBasicosDoInicio, type ErrosDosDadosBasicosDoInicio } from "@/lib/painel/onboarding-options";

export type Etapa = "dados" | "pronto";

/** O modelo marcado de saída: funciona bem mesmo sem fotos (o desenho usa o monograma do casal). */
const MODELO_INICIAL: IdDoModelo = "arco";
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

/** Os campos da tela: valores, erro por campo e o modelo marcado. O erro some assim que a pessoa mexe no campo. */
function useCamposDoInicio(initial: ValoresIniciais) {
  const [yourName, setYourName] = useState(initial.yourName);
  const [partnerName, setPartnerName] = useState(initial.partnerName);
  const [weddingDate, setWeddingDate] = useState(initial.weddingDate ?? "");
  const [template, setTemplate] = useState<IdDoModelo>(MODELO_INICIAL);
  const [errors, setErrors] = useState<ErrosDosDadosBasicosDoInicio>({});

  const edit = (key: keyof ErrosDosDadosBasicosDoInicio, set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set(e.target.value);
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  return {
    yourName, partnerName, weddingDate, template, errors, setErrors,
    coupleNames: juntarNomesDoCasal(yourName, partnerName) || "Vocês dois",
    escolherModelo: setTemplate,
    editarSeuNome: edit("yourName", setYourName),
    editarNomeDoParceiro: edit("partnerName", setPartnerName),
    editarData: edit("weddingDate", setWeddingDate),
  };
}

export function useDadosDoInicio(initial: ValoresIniciais, done: Resultado | null) {
  const campos = useCamposDoInicio(initial);
  const [step, setStep] = useState<Etapa>(done ? "pronto" : "dados");
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<Resultado | null>(done);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const { yourName, partnerName, weddingDate, template } = campos;
    const found = validarDadosBasicosDoInicio({ yourName, partnerName, weddingDate });
    campos.setErrors(found);
    if (focarPrimeiroErro(found)) return;

    startTransition(async () => {
      const res = await concluirInicio({ yourName, partnerName, weddingDate: weddingDate || null, template });
      if (res.success) {
        setResult({ slug: res.slug, coupleNames: res.coupleNames });
        setStep("pronto");
      } else if (res.redirectTo) window.location.href = res.redirectTo;
      else setFormError(res.error);
    });
  };

  return { ...campos, step, result, formError, isPending, submit };
}

export type DadosDoInicio = ReturnType<typeof useDadosDoInicio>;
