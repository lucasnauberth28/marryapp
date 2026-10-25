import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Campo, AvisoDoFormulario } from "@/components/ui/field";
import { mascararTelefone } from "@/lib/formatacao/telefone";
import { finalDoTelefone } from "@/lib/saved-guest";
import { estiloDoBotao, estiloDoBotaoComSeta } from "@/components/landing/styles";
import { cn } from "@/lib/utils";
import { ESTILO_DO_SOBRETITULO, ESTILO_DO_TITULO, type PropriedadesDoPasso } from "./tipos";
import type { Identificacao } from "./use-dados-do-pagamento";

function ConvidadoReconhecido({ recognized, aoDispensar }: { recognized: NonNullable<Identificacao["recognized"]>; aoDispensar: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-[16px] border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)]">
      <div className="min-w-0">
        <p className={ESTILO_DO_SOBRETITULO}>Presente de</p>
        <p className="truncate text-lg font-semibold leading-7 text-tinta">{recognized.name}</p>
        <p className="text-sm leading-5 text-tinta-suave">WhatsApp {finalDoTelefone(recognized.phone)}</p>
      </div>
      <button type="button" onClick={aoDispensar} className={cn(estiloDoBotao.quiet, "min-h-11 self-start px-0")}>
        Não sou essa pessoa
      </button>
    </div>
  );
}

function CamposDeIdentificacao({ id }: { id: Identificacao }) {
  return (
    <>
      <Campo id="checkout-nome" label="Seu nome completo">
        {(c) => <input {...c} id="checkout-nome" name="name" autoComplete="name" value={id.typedName} onChange={(e) => id.setTypedName(e.target.value)} placeholder="Como os noivos conhecem você" required />}
      </Campo>
      <Campo id="checkout-telefone" label="Seu WhatsApp com DDD">
        {(c) => (
          <input
            {...c}
            id="checkout-telefone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={id.typedPhone}
            onChange={(e) => id.setTypedPhone(mascararTelefone(e.target.value))}
            placeholder="(11) 99999-9999"
            required
          />
        )}
      </Campo>
    </>
  );
}

interface Propriedades extends PropriedadesDoPasso {
  identificacao: Identificacao;
  coupleNames: string;
  error: string | null;
  aoContinuar: (e: React.FormEvent) => void;
}

export function PassoDeIdentificacao({ titulo, identificacao, coupleNames, error, aoContinuar }: Propriedades) {
  const { recognized } = identificacao;
  return (
    <form onSubmit={aoContinuar} noValidate className="step-in flex flex-col gap-5 pt-2">
      <div className="flex flex-col gap-2">
        <p className={ESTILO_DO_SOBRETITULO}>Passo 1 de 3</p>
        <h2 ref={titulo} tabIndex={-1} className={ESTILO_DO_TITULO}>
          {recognized ? "Confirme quem presenteia" : "Quem está presenteando?"}
        </h2>
        <p className="text-tinta-suave">{recognized ? "Você se identificou na confirmação de presença. Usamos esses dados para não pedir de novo." : "Para os noivos saberem quem presenteou."}</p>
      </div>

      {recognized ? <ConvidadoReconhecido recognized={recognized} aoDispensar={identificacao.dispensar} /> : <CamposDeIdentificacao id={identificacao} />}

      <p className="text-sm leading-5 text-tinta-suave">
        Usamos seu nome e WhatsApp só para avisar {coupleNames} de quem presenteou e para confirmar o pagamento. Veja a{" "}
        <Link href="/privacidade" target="_blank" className="font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 hover:decoration-ameixa">
          política de privacidade
        </Link>
        .
      </p>

      {error ? <AvisoDoFormulario>{error}</AvisoDoFormulario> : null}

      <button type="submit" className={cn(estiloDoBotao.primary, estiloDoBotao.block, "min-h-12")}>
        {recognized ? "Sim, sou eu. Continuar" : "Continuar para o pagamento"}
        <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
      </button>
    </form>
  );
}
