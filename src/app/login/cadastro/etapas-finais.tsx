import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PixDaAssinatura } from "@/components/checkout/subscription-pix";
import { estiloDoBotao, estiloDoBotaoComSeta } from "@/components/landing/styles";
import { cn } from "@/lib/utils";
import type { OpcaoDePlano } from "../auth-config";
import { Titulo, type TituloRef } from "./pecas";

interface PropriedadesDoPagamento {
  titulo: TituloRef;
  plan: OpcaoDePlano;
  customModules: string[] | undefined;
  isVendor: boolean;
  leaving: boolean;
  aoPagar: () => void;
  aoPagarDepois: () => void;
}

export function EtapaDoPagamento({ titulo, plan, customModules, isVendor, leaving, aoPagar, aoPagarDepois }: PropriedadesDoPagamento) {
  return (
    <section aria-labelledby="cadastro-titulo" className="step-in flex flex-col gap-6">
      <Titulo ref={titulo} title="Falta só o Pix" text="A conta já está criada. O plano é ativado assim que o pagamento for confirmado." />
      <PixDaAssinatura planId={plan.id} modules={plan.id === "custom" ? customModules : undefined} planName={`Plano ${plan.name}`} onPaid={aoPagar} />
      <div className="flex flex-col gap-3">
        <button type="button" onClick={aoPagarDepois} disabled={leaving} className={cn(estiloDoBotao.quiet, "self-center")}>
          {isVendor ? "Pagar depois e continuar no plano Start" : "Pagar depois e continuar no plano Básico"}
        </button>
      </div>
    </section>
  );
}

interface PropriedadesDoPronto {
  titulo: TituloRef;
  isVendor: boolean;
  firstName: string;
  paid: boolean;
  redirectTo: string | null;
}

export function EtapaPronta({ titulo, isVendor, firstName, paid, redirectTo }: PropriedadesDoPronto) {
  return (
    <section aria-labelledby="cadastro-titulo" className="step-in flex flex-col gap-6">
      <span className="grid size-14 place-items-center rounded-full bg-sucesso-suave text-sucesso">
        <CheckCircle2 aria-hidden="true" className="size-7" strokeWidth={1.6} />
      </span>
      {isVendor ? (
        <>
          <Titulo ref={titulo} title={firstName ? `Boas-vindas, ${firstName}` : "Cadastro recebido"} text="Seu perfil já está na fila da curadoria. Enquanto isso, complete as informações no painel: perfis completos são aprovados mais rápido." />
          <a href={redirectTo ?? "/fornecedor"} className={cn(estiloDoBotao.primary, estiloDoBotao.block, "min-h-12")}>
            Ir para o meu painel
            <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
          </a>
        </>
      ) : (
        <>
          <Titulo ref={titulo} title={firstName ? `Tudo certo, ${firstName}` : "Conta criada"} text={`A conta de vocês está criada${paid ? " e o pagamento foi confirmado" : ""}. Falta só dizer os nomes e a data: leva menos de um minuto.`} />
          {/* Navegação completa: a próxima tela lê o cookie de sessão recém-criado. */}
          <a href={redirectTo ?? "/boas-vindas"} className={cn(estiloDoBotao.primary, estiloDoBotao.block, "min-h-12")}>
            Continuar para o casamento
            <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
          </a>
        </>
      )}
    </section>
  );
}
