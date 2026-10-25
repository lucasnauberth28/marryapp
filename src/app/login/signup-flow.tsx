"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Catalogo } from "@/lib/pagamento/catalog";
import { planosPara, type TipoDeConta, type OpcaoDePlano, type EtapaDoCadastro } from "./auth-config";
import { EtapaDosDados } from "./cadastro/etapa-dados";
import { EtapaDoPagamento, EtapaPronta } from "./cadastro/etapas-finais";
import { EtapaDoPlano, EtapaDoTipo } from "./cadastro/etapas-de-escolha";
import { Progresso } from "./cadastro/pecas";
import { useCamposDoCadastro, useEnvioDoCadastro } from "./cadastro/use-cadastro";

interface PropriedadesDoFluxoDeCadastro {
  step: EtapaDoCadastro;
  type: TipoDeConta | null;
  onStepChange: (step: EtapaDoCadastro) => void;
  onTypeChange: (type: TipoDeConta) => void;
  /** Plano vindo da URL (?plano=classic) ou do plano adaptado. */
  initialPlanId?: string;
  customModules?: string[];
  /** Preços vigentes (catálogo do servidor). */
  catalog?: Catalogo;
  /** Conta já existente: leva para a aba Entrar com o e-mail preenchido. */
  onGoToLogin: (email: string) => void;
}

/** Etapas reais do caminho: o tipo de conta só conta se a pessoa passou por ele, e o pagamento só existe em plano pago. */
function etapasDoCaminho(comTipo: boolean, plan: OpcaoDePlano | undefined): EtapaDoCadastro[] {
  return [...(comTipo ? (["tipo"] as const) : []), "plano", "dados", ...(plan && plan.price > 0 ? (["pagamento"] as const) : [])];
}

/** A cada troca de etapa, o foco vai para o título novo (teclado e leitor de tela acompanham). */
function useFocoNoTitulo(titulo: React.RefObject<HTMLHeadingElement | null>, step: EtapaDoCadastro) {
  const primeiraRenderizacao = useRef(true);
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    titulo.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, titulo]);
}

/** O plano escolhido (o primeiro da lista, sem plano na URL) e as etapas do caminho. */
function useEscolhaDoPlano(step: EtapaDoCadastro, type: TipoDeConta | null, initialPlanId: string | undefined, customModules: string[] | undefined, catalog: Catalogo | undefined) {
  const plans = useMemo(() => (type ? planosPara(type, customModules, catalog) : []), [type, customModules, catalog]);
  const [planId, setPlanId] = useState<string | null>(initialPlanId ?? null);
  // Sem plano na URL, a escolha começa pelo primeiro da lista (Básico para casais, Start para fornecedores).
  const plan: OpcaoDePlano | undefined = plans.find((p) => p.id === planId) ?? plans[0];
  const [startedAtType] = useState(step === "tipo");
  return { plans, plan, planId, setPlanId, flowSteps: etapasDoCaminho(startedAtType, plan) };
}

export function FluxoDeCadastro({ step, type, onStepChange, onTypeChange, initialPlanId, customModules, catalog, onGoToLogin }: PropriedadesDoFluxoDeCadastro) {
  const { plans, plan, planId, setPlanId, flowSteps } = useEscolhaDoPlano(step, type, initialPlanId, customModules, catalog);
  const isVendor = type === "fornecedor";
  const campos = useCamposDoCadastro();
  const envio = useEnvioDoCadastro({ campos, isVendor, plan, customModules, aoMudarEtapa: onStepChange });
  const [paid, setPaid] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  useFocoNoTitulo(titulo, step);

  const handlePaid = useCallback(() => {
    setPaid(true);
    onStepChange("pronto");
  }, [onStepChange]);

  const escolherTipo = (tipo: TipoDeConta) => {
    onTypeChange(tipo);
    const validos = planosPara(tipo, tipo === "casal" ? customModules : undefined, catalog);
    if (planId && !validos.some((p) => p.id === planId)) setPlanId(null);
    onStepChange("plano");
  };

  const pagarDepois = () => {
    if (isVendor) return onStepChange("pronto");
    envio.setLeaving(true);
    window.location.assign(envio.redirectTo ?? "/boas-vindas");
  };

  return (
    <div className="flex flex-col">
      {step !== "pronto" ? <Progresso step={step} steps={flowSteps} /> : null}

      {step === "tipo" ? <EtapaDoTipo titulo={titulo} type={type} aoEscolher={escolherTipo} /> : null}

      {step === "plano" && type ? (
        <EtapaDoPlano titulo={titulo} isVendor={isVendor} plans={plans} plan={plan} aoEscolher={setPlanId} aoVoltar={() => onStepChange("tipo")} aoContinuar={() => onStepChange("dados")} />
      ) : null}

      {step === "dados" && type && plan ? (
        <EtapaDosDados titulo={titulo} isVendor={isVendor} plan={plan} campos={campos} envio={envio} aoVoltarAoPlano={() => onStepChange("plano")} aoIrParaOLogin={onGoToLogin} />
      ) : null}

      {step === "pagamento" && plan ? (
        <EtapaDoPagamento titulo={titulo} plan={plan} customModules={customModules} isVendor={isVendor} leaving={envio.leaving} aoPagar={handlePaid} aoPagarDepois={pagarDepois} />
      ) : null}

      {step === "pronto" ? <EtapaPronta titulo={titulo} isVendor={isVendor} firstName={campos.name.trim().split(/\s+/)[0] || ""} paid={paid} redirectTo={envio.redirectTo} /> : null}
    </div>
  );
}
