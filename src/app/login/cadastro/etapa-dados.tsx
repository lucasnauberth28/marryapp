import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail, Phone, User } from "lucide-react";
import { AlternarVisibilidadeDaSenha } from "@/components/account/password-toggle";
import { estiloDoBotao, estiloDoBotaoComSeta } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { Campo, AvisoDoFormulario } from "@/components/ui/field";
import { mascararTelefone } from "@/lib/formatacao/telefone";
import { cn } from "@/lib/utils";
import { formatarPrecoDoPlano, type OpcaoDePlano } from "../auth-config";
import { CamposDeFornecedor } from "./campos-de-fornecedor";
import { BotaoVoltar, Titulo, type TituloRef } from "./pecas";
import type { Campos, useEnvioDoCadastro } from "./use-cadastro";

function PlanoEscolhido({ plan, aoTrocar }: { plan: OpcaoDePlano; aoTrocar: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-linha bg-papel px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">Plano escolhido</p>
        <p className="truncate font-semibold text-tinta">
          {plan.name} · {formatarPrecoDoPlano(plan.price)}
          {plan.price > 0 ? <span className="font-normal text-tinta-suave"> {plan.period}</span> : null}
        </p>
      </div>
      <button type="button" onClick={aoTrocar} className={cn(estiloDoBotao.quiet, estiloDoBotao.sm)}>
        Trocar
      </button>
    </div>
  );
}

function CamposDaConta({ campos, errors }: { campos: Campos; errors: ReturnType<typeof useEnvioDoCadastro>["errors"] }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <>
      <Campo id="cadastro-email" label="E-mail" icon={Mail} error={errors.email} hint="Usaremos este e-mail para o acesso à conta.">
        {(c) => <input {...c} id="cadastro-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="voce@email.com" value={campos.email} onChange={(e) => campos.setEmail(e.target.value)} />}
      </Campo>
      <Campo id="cadastro-phone" label="WhatsApp" icon={Phone} error={errors.phone} hint="Informe com DDD, por exemplo (11) 98765-4321.">
        {(c) => <input {...c} id="cadastro-phone" name="tel" type="tel" autoComplete="tel-national" placeholder="(11) 98765-4321" value={campos.phone} onChange={(e) => campos.setPhone(mascararTelefone(e.target.value))} />}
      </Campo>
      <Campo id="cadastro-password" label="Crie uma senha" icon={Lock} error={errors.password} hint="Pelo menos 8 caracteres." trailing={<AlternarVisibilidadeDaSenha show={showPassword} onToggle={() => setShowPassword((v) => !v)} />}>
        {(c) => <input {...c} id="cadastro-password" name="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={campos.password} onChange={(e) => campos.setPassword(e.target.value)} />}
      </Campo>
    </>
  );
}

const LINK_DE_TEXTO = "font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 hover:decoration-ameixa";

function AceiteDosTermos() {
  return (
    <p className="text-center text-sm leading-5 text-tinta-suave">
      Ao criar a conta, você concorda com os{" "}
      <Link href="/termos" target="_blank" className={LINK_DE_TEXTO}>
        termos de uso
      </Link>{" "}
      e a{" "}
      <Link href="/privacidade" target="_blank" className={LINK_DE_TEXTO}>
        política de privacidade
      </Link>{" "}
      do Aceito.
    </p>
  );
}

interface Propriedades {
  titulo: TituloRef;
  isVendor: boolean;
  plan: OpcaoDePlano;
  campos: Campos;
  envio: ReturnType<typeof useEnvioDoCadastro>;
  aoVoltarAoPlano: () => void;
  aoIrParaOLogin: (email: string) => void;
}

export function EtapaDosDados({ titulo, isVendor, plan, campos, envio, aoVoltarAoPlano, aoIrParaOLogin }: Propriedades) {
  const { errors, formError } = envio;
  return (
    <section aria-labelledby="cadastro-titulo" className="step-in flex flex-col gap-6">
      <Titulo
        ref={titulo}
        title={isVendor ? "Dados do seu negócio" : "Criem a conta para organizar o casamento."}
        text={isVendor ? "Seu perfil passa pela curadoria antes de aparecer na vitrine." : "Uma pessoa pode começar o cadastro. Depois, vocês podem convidar o par para participar."}
      />
      <PlanoEscolhido plan={plan} aoTrocar={aoVoltarAoPlano} />

      <form onSubmit={envio.submit} noValidate className="flex flex-col gap-5">
        <Campo id="cadastro-name" label="Seu nome" icon={User} error={errors.name}>
          {(c) => <input {...c} id="cadastro-name" name="name" autoComplete="name" value={campos.name} onChange={(e) => campos.setName(e.target.value)} />}
        </Campo>
        {isVendor ? <CamposDeFornecedor campos={campos} errors={errors} /> : null}
        <CamposDaConta campos={campos} errors={errors} />

        {formError ? (
          <AvisoDoFormulario id="cadastro-erro">
            <p>{formError.message}</p>
            {formError.existingAccount ? (
              <button type="button" onClick={() => aoIrParaOLogin(campos.email.trim().toLowerCase())} className="mt-1 font-semibold text-ameixa underline underline-offset-4">
                Entrar com este e-mail
              </button>
            ) : null}
          </AvisoDoFormulario>
        ) : null}

        <div className="mt-1 flex items-center gap-3">
          <BotaoVoltar onClick={aoVoltarAoPlano} />
          <Botao type="submit" loading={envio.isPending || envio.leaving} className="h-12 flex-1 rounded-[12px] px-6">
            {plan.price > 0 ? "Criar conta e pagar" : "Criar conta"}
            <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
          </Botao>
        </div>
        <AceiteDosTermos />
      </form>
    </section>
  );
}
