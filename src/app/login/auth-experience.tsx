"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { LoginForm } from "./login-form";
import { SignupFlow } from "./signup-flow";
import { photoFor, typeOfPlan, type AccountType, type AuthMode, type SignupStep } from "./auth-config";

interface AuthExperienceProps {
  initialMode: AuthMode;
  initialType?: AccountType | null;
  initialPlanId?: string;
  customModules?: string[];
}

/**
 * Tela única de acesso: entrar e criar conta lado a lado, sem recarregar a página.
 * /login abre na aba Entrar e /cadastro na aba Criar conta.
 */
export function AuthExperience({ initialMode, initialType = null, initialPlanId, customModules }: AuthExperienceProps) {
  const planType = typeOfPlan(initialPlanId);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [type, setType] = useState<AccountType | null>(initialType ?? planType);
  // Com o tipo já conhecido (vindo de um plano da landing), o cadastro começa na escolha do plano.
  const [step, setStep] = useState<SignupStep>(initialType || planType ? "plano" : "tipo");
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

  const photo = photoFor(mode, step, type);

  return (
    <div className="flex min-h-dvh bg-linho text-tinta">
      {/* Coluna do formulário */}
      <div className="flex min-w-0 flex-1 flex-col lg:px-[clamp(24px,5vw,80px)] lg:py-8">
        <header className="flex h-16 items-center gap-1 px-2 lg:h-auto lg:px-0">
          <Link
            href="/"
            aria-label="Voltar para o início"
            className="grid size-11 place-items-center rounded-[12px] text-tinta transition-colors hover:bg-areia lg:hidden"
          >
            <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </Link>
          <Link href="/" aria-label="Aceito, início" className="-m-2.5 rounded-[12px] p-2.5 transition-opacity hover:opacity-80">
            <Logo height={24} priority className="lg:hidden" />
            <Logo height={28} priority className="hidden lg:block" />
          </Link>
        </header>

        {/* Faixa de foto no celular */}
        <div key={`m-${photo.src}`} className="photo-in relative mx-4 h-36 overflow-hidden rounded-[16px] bg-areia sm:h-48 lg:hidden">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 1024px) 1px, 100vw"
            className="object-cover"
            style={{ objectPosition: photo.position ?? "50% 45%" }}
          />
        </div>

        <main id="conteudo" className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center px-4 pb-8 pt-6 lg:px-0 lg:py-12">
          {!accountCreated ? (
            <div role="tablist" aria-label="Acesso" className="mb-8 grid grid-cols-2 gap-1 rounded-[12px] bg-areia p-1">
              <TabButton id="aba-entrar" controls="painel-acesso" active={mode === "entrar"} onClick={() => setMode("entrar")}>
                Entrar
              </TabButton>
              <TabButton id="aba-criar" controls="painel-acesso" active={mode === "criar"} onClick={() => setMode("criar")}>
                Criar conta
              </TabButton>
            </div>
          ) : null}

          <div id="painel-acesso" role="tabpanel" aria-labelledby={mode === "entrar" ? "aba-entrar" : "aba-criar"}>
            {mode === "entrar" ? (
              <div key="entrar" className="step-in flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h1 className="font-display text-[34px] font-normal leading-10 tracking-[-0.015em] lg:text-[44px] lg:leading-[50px]">
                    Que bom ver vocês
                  </h1>
                  <p className="text-base leading-6 text-tinta-suave">Entrem para continuar organizando o casamento.</p>
                </div>
                <LoginForm key={loginEmail} initialEmail={loginEmail} onCreateAccount={() => setMode("criar")} />
              </div>
            ) : (
              <SignupFlow
                step={step}
                type={type}
                onStepChange={setStep}
                onTypeChange={setType}
                initialPlanId={initialPlanId}
                customModules={customModules}
                onGoToLogin={goToLogin}
              />
            )}
          </div>
        </main>

        <p className="px-4 pb-8 text-center text-sm text-tinta-suave lg:px-0 lg:pb-2 lg:text-left">
          Convidado? Você não precisa de conta: use o link do convite.
        </p>
      </div>

      {/* Painel da foto no computador: muda conforme a etapa */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden border-l border-linha bg-areia lg:flex">
        <div className="relative w-[min(420px,64%)]">
          <span aria-hidden="true" className="arch pointer-events-none absolute -inset-2.5 border border-champanhe" />
          <div className="arch relative aspect-[2/3] overflow-hidden bg-papel">
            <Image
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 420px, 1px"
              className="photo-in object-cover"
              style={{ objectPosition: photo.position ?? "50% 50%" }}
            />
          </div>
        </div>
        <p key={photo.caption} className="step-in absolute inset-x-0 bottom-8 px-6 text-center font-display text-2xl text-tinta-suave">
          {photo.caption}
        </p>
      </div>
    </div>
  );
}

function TabButton({
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
