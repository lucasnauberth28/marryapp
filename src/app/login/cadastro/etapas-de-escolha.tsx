import Link from "next/link";
import { ArrowRight, Heart, Store } from "lucide-react";
import { estiloDoBotao, estiloDoBotaoComSeta } from "@/components/landing/styles";
import { cn } from "@/lib/utils";
import type { OpcaoDePlano, TipoDeConta } from "../auth-config";
import { BotaoVoltar, CartaoDePlano, CartaoDeTipo, Titulo, type TituloRef } from "./pecas";

export function EtapaDoTipo({ titulo, type, aoEscolher }: { titulo: TituloRef; type: TipoDeConta | null; aoEscolher: (tipo: TipoDeConta) => void }) {
  return (
    <section aria-labelledby="cadastro-titulo" className="step-in flex flex-col gap-6">
      <Titulo ref={titulo} title="Que conta vocês querem criar?" text="Escolham o tipo de conta. Convidados não precisam de conta: usam o link enviado pelo casal." />
      <div role="group" aria-label="Tipo de conta" className="flex flex-col gap-3">
        <CartaoDeTipo icon={Heart} title="Vamos casar" text="Site do casamento, lista de convidados e presentes em dinheiro." selected={type === "casal"} onClick={() => aoEscolher("casal")} />
        <CartaoDeTipo icon={Store} title="Sou fornecedor" text="Sua vitrine para casais da sua região, com pedidos de orçamento no painel." selected={type === "fornecedor"} onClick={() => aoEscolher("fornecedor")} />
      </div>
    </section>
  );
}

interface PropriedadesDaEtapaDoPlano {
  titulo: TituloRef;
  isVendor: boolean;
  plans: OpcaoDePlano[];
  plan: OpcaoDePlano | undefined;
  aoEscolher: (id: string) => void;
  aoVoltar: () => void;
  aoContinuar: () => void;
}

export function EtapaDoPlano({ titulo, isVendor, plans, plan, aoEscolher, aoVoltar, aoContinuar }: PropriedadesDaEtapaDoPlano) {
  return (
    <section aria-labelledby="cadastro-titulo" className="step-in flex flex-col gap-6">
      <Titulo
        ref={titulo}
        title={isVendor ? "Escolha seu plano" : "Escolham o plano para começar."}
        text={isVendor ? "O Start é gratuito. Você pode mudar de plano depois." : "O Básico permite começar sem mensalidade. Comparem os recursos e as taxas antes de continuar."}
      />
      <div role="radiogroup" aria-label="Planos" className="flex flex-col gap-3">
        {plans.map((p) => (
          <CartaoDePlano key={p.id} plan={p} selected={plan?.id === p.id} onSelect={() => aoEscolher(p.id)} />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <BotaoVoltar onClick={aoVoltar} />
        <button type="button" onClick={aoContinuar} className={cn(estiloDoBotao.primary, "min-h-12 flex-1")}>
          Continuar com o {plan?.name}
          <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
        </button>
      </div>
      {!isVendor ? (
        <p className="text-center text-[15px] text-tinta-suave">
          Precisam só de algumas partes?{" "}
          <Link href="/monte-seu-plano" className="font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 hover:decoration-ameixa">
            Montem o plano de vocês
          </Link>
        </p>
      ) : null}
    </section>
  );
}
