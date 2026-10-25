"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Aparicao } from "@/components/motion/reveal";
import { atualizarPerfilDoFornecedor, type EntradaDoPerfilDoFornecedor } from "@/actions/vendor-panel-actions";
import { Botao } from "@/components/ui/button";
import { BotaoDePrevia } from "./_perfil/botao-de-previa";
import { ContatoERedes, SobreONegocio, type MudarCampoDoPerfil, type ValoresDoFormulario } from "./_perfil/campos-do-perfil";

const ID_DO_FORMULARIO = "perfil-fornecedor";

interface PropriedadesDoFormularioDePerfil {
  vendorId: string;
  isPublic: boolean;
  categories: string[];
  initial: ValoresDoFormulario;
  /** Aviso da curadoria, exibido logo abaixo do título. */
  notice?: React.ReactNode;
  /** Portfólio (fotos): vem antes dos campos de texto, como no design. */
  portfolio?: React.ReactNode;
}

function CabecalhoDoPerfil({ vendorId, isPublic, salvar }: { vendorId: string; isPublic: boolean; salvar: React.ReactNode }) {
  return (
    <Aparicao variant="fade" className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase">Meu perfil</p>
        <h1 className="font-display text-[28px] leading-9 font-medium md:text-[40px] md:leading-[46px]">Como os casais veem você</h1>
      </div>
      <div className="hidden gap-2 sm:flex">
        {isPublic ? <BotaoDePrevia vendorId={vendorId} /> : null}
        {salvar}
      </div>
    </Aparicao>
  );
}

export function FormularioDePerfil({ vendorId, isPublic, categories, initial, notice, portfolio }: PropriedadesDoFormularioDePerfil) {
  const [values, setValues] = useState<ValoresDoFormulario>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const set: MudarCampoDoPerfil = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await atualizarPerfilDoFornecedor(values satisfies EntradaDoPerfilDoFornecedor);
      if (res.success) return void toast.success(isPublic ? "Perfil salvo. Os casais já veem a nova versão." : "Perfil salvo.");
      const message = res.error ?? "Não foi possível salvar o perfil.";
      setError(message);
      toast.error(message);
    });
  }

  const saveButton = (
    <Botao type="submit" form={ID_DO_FORMULARIO} loading={isPending}>
      Salvar
    </Botao>
  );

  return (
    <>
      <CabecalhoDoPerfil vendorId={vendorId} isPublic={isPublic} salvar={saveButton} />
      {notice}
      {portfolio}
      <form id={ID_DO_FORMULARIO} onSubmit={onSubmit} noValidate className="flex flex-col gap-6" aria-describedby={error ? "perfil-erro" : undefined}>
        {error ? (
          <p id="perfil-erro" role="alert" className="rounded-xl bg-perigo-suave px-4 py-3 text-sm font-medium text-perigo">
            {error}
          </p>
        ) : null}
        <SobreONegocio values={values} set={set} categories={categories} />
        <ContatoERedes values={values} set={set} />
        <div className="flex flex-col gap-2 sm:hidden">
          {saveButton}
          {isPublic ? <BotaoDePrevia vendorId={vendorId} /> : null}
        </div>
      </form>
    </>
  );
}
