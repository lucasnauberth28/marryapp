import { useId } from "react";
import type { RespostaDoRepasse } from "@/actions/payout-actions";
import { Botao } from "@/components/ui/button";
import { Cartao, CabecalhoDoCartao, ConteudoDoCartao, DescricaoDoCartao, TituloDoCartao } from "@/components/ui/card";
import { CamposDaContaBancaria, CamposDoPix, DadosDoTitular, EscolhaDoTipo, SenhaDeProtecao } from "./campos-do-repasse";
import { useFormularioDeRepasse } from "./use-formulario-de-repasse";

interface PropriedadesDoFormulario {
  replacing: boolean;
  onCancel: () => void;
  onSaved: (res: RespostaDoRepasse) => boolean;
}

export function FormularioDeRepasse({ replacing, onCancel, onSaved }: PropriedadesDoFormulario) {
  const uid = useId();
  const form = useFormularioDeRepasse(onSaved);
  return (
    <Cartao className="gap-4">
      <CabecalhoDoCartao>
        <TituloDoCartao>{replacing ? "Trocar os dados de recebimento" : "Cadastrar onde receber"}</TituloDoCartao>
        <DescricaoDoCartao>
          {replacing
            ? "Os dados novos substituem os atuais, e as pessoas do casamento recebem um aviso. Por segurança, não mostramos o que está salvo."
            : "Use uma chave Pix ou uma conta que esteja no nome de quem vai receber."}
        </DescricaoDoCartao>
      </CabecalhoDoCartao>
      <ConteudoDoCartao>
        <form onSubmit={form.submit} className="flex flex-col gap-6" autoComplete="off">
          <EscolhaDoTipo uid={uid} form={form} />
          <DadosDoTitular uid={uid} form={form} />
          {form.campos.kind === "PIX_KEY" ? <CamposDoPix uid={uid} form={form} /> : <CamposDaContaBancaria uid={uid} form={form} />}
          <SenhaDeProtecao uid={uid} form={form} />
          {form.error && (
            <p role="alert" className="rounded-xl border border-perigo/40 bg-perigo-suave px-4 py-3 text-sm leading-5 text-perigo">
              {form.error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Botao type="submit" loading={form.pending}>
              {replacing ? "Salvar os novos dados" : "Salvar"}
            </Botao>
            <Botao type="button" variant="ghost" onClick={onCancel} disabled={form.pending}>
              Cancelar
            </Botao>
          </div>
        </form>
      </ConteudoDoCartao>
    </Cartao>
  );
}
