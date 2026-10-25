"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { PalcoDeAcesso } from "@/components/account/auth-stage";
import { cn } from "@/lib/utils";
import { FormularioDeLogin } from "./login-form";
import { FluxoDeCadastro } from "./signup-flow";
import { fotoPara, tipoDoPlano, type TipoDeConta, type ModoDeAcesso, type EtapaDoCadastro } from "./auth-config";
import type { Catalogo } from "@/lib/pagamento/catalog";

interface PropriedadesDaExperienciaDeAcesso {
  initialMode: ModoDeAcesso;
  initialType?: TipoDeConta | null;
  initialPlanId?: string;
  customModules?: string[];
  /** Preços vigentes (catálogo do servidor); sem ele valem os do código. */
  catalog?: Catalogo;
  /** Caminho (já validado no servidor) para onde voltar depois de entrar. */
  nextPath?: string | null;
  /** A pessoa chegou aqui porque a sessão expirou. */
  sessionExpired?: boolean;
}

/**
 * Tela única de acesso: entrar e criar conta lado a lado, sem recarregar a página.
 * /login abre na aba Entrar e /cadastro na aba Criar conta.
 */
export function ExperienciaDeAcesso({ initialMode, initialType = null, initialPlanId, customModules, catalog, nextPath = null, sessionExpired = false }: PropriedadesDaExperienciaDeAcesso) {
  const planType = tipoDoPlano(initialPlanId);
  const [mode, setMode] = useState<ModoDeAcesso>(initialMode);
  const [type, setType] = useState<TipoDeConta | null>(initialType ?? planType);
  // Com o tipo já conhecido (vindo de um plano da landing), o cadastro começa na escolha do plano.
  const [step, setStep] = useState<EtapaDoCadastro>(initialType || planType ? "plano" : "tipo");
  const [loginEmail, setLoginEmail] = useState("");

  const accountCreated = step === "pagamento" || step === "pronto";

  // Só o título acompanha a aba. A URL fica como chegou (/login ou /cadastro): trocar o caminho
  // faria o router remontar a outra página no refresh que segue a criação da conta (cookie novo),
  // e o cadastro perderia a etapa em que estava.
  useEffect(() => {
    document.title = mode === "entrar" ? "Entrar | Aceito" : "Criar conta | Aceito";
  }, [mode]);

  const goToLogin = useCallback((email: string) => {
    setLoginEmail(email);
    setMode("entrar");
  }, []);

  const photo = fotoPara(mode, step, type);

  return (
    <PalcoDeAcesso
      photo={photo}
      footnote="Foi convidado para um casamento? Use o link enviado pelo casal. Você não precisa criar uma conta."
    >
      {!accountCreated ? <AbasDeAcesso mode={mode} aoEscolher={setMode} /> : null}

      <div id="painel-acesso" role="tabpanel" aria-labelledby={mode === "entrar" ? "aba-entrar" : "aba-criar"}>
        {mode === "entrar" ? (
          <PainelDeEntrar key="entrar" sessionExpired={sessionExpired} loginEmail={loginEmail} nextPath={nextPath} aoCriarConta={() => setMode("criar")} />
        ) : (
          <FluxoDeCadastro
            step={step}
            type={type}
            onStepChange={setStep}
            onTypeChange={setType}
            initialPlanId={initialPlanId}
            customModules={customModules}
            catalog={catalog}
            onGoToLogin={goToLogin}
          />
        )}
      </div>
    </PalcoDeAcesso>
  );
}

function AbasDeAcesso({ mode, aoEscolher }: { mode: ModoDeAcesso; aoEscolher: (m: ModoDeAcesso) => void }) {
  return (
    <div role="tablist" aria-label="Acesso" className="mb-8 grid grid-cols-2 gap-1 rounded-[12px] bg-areia p-1">
      <BotaoDeAba id="aba-entrar" controls="painel-acesso" active={mode === "entrar"} onClick={() => aoEscolher("entrar")}>
        Entrar
      </BotaoDeAba>
      <BotaoDeAba id="aba-criar" controls="painel-acesso" active={mode === "criar"} onClick={() => aoEscolher("criar")}>
        Criar conta
      </BotaoDeAba>
    </div>
  );
}

interface PropriedadesDoPainelDeEntrar {
  sessionExpired: boolean;
  loginEmail: string;
  nextPath: string | null;
  aoCriarConta: () => void;
}

function PainelDeEntrar({ sessionExpired, loginEmail, nextPath, aoCriarConta }: PropriedadesDoPainelDeEntrar) {
  return (
    <div className="step-in flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[30px] font-medium leading-9 tracking-[-0.015em] lg:text-[36px] lg:leading-[42px]">Que bom ver vocês</h1>
        <p className="text-base leading-6 text-tinta-suave">Entrem para continuar organizando o casamento.</p>
      </div>
      {sessionExpired ? (
        <p role="status" className="flex items-start gap-2.5 rounded-[12px] border border-linha bg-areia px-4 py-3 text-[15px] leading-6 text-tinta">
          <Clock aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-tinta-suave" strokeWidth={1.6} />
          Sua sessão expirou. Entre de novo para continuar.
        </p>
      ) : null}
      <FormularioDeLogin key={loginEmail} initialEmail={loginEmail} nextPath={nextPath} onCreateAccount={aoCriarConta} />
    </div>
  );
}

function BotaoDeAba({
  id,
  controls,
  active,
  onClick,
  children,
}: {
  id: string;
  controls: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={cn(
        "flex min-h-11 cursor-pointer items-center justify-center rounded-[10px] font-semibold transition-[background-color,color,box-shadow] duration-300 ease-[var(--ease-aceito)]",
        active ? "bg-papel text-tinta shadow-[var(--shadow-aceito-1)]" : "text-tinta-suave hover:bg-papel/60 hover:text-tinta",
      )}
    >
      {children}
    </button>
  );
}
