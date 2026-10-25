import { Upload } from "lucide-react";
import { IlustracaoDaLiz } from "@/components/liz/liz-illustration";
import { estiloDoBotao, estiloDoCartao } from "@/components/painel/styles";

export function EstadoVazioDosConvidados({ aoAdicionar, aoImportar }: { aoAdicionar: () => void; aoImportar: () => void }) {
  return (
    <div className={`${estiloDoCartao} flex flex-col items-center gap-3 px-6 pb-14 pt-8 text-center`}>
      {/* A Liz recebe a lista vazia; decorativa e pequena, para os botões ficarem à vista no celular */}
      <IlustracaoDaLiz pose="cumprimentando" height={104} decorative className="h-[104px] w-auto" />
      <h2 className="font-display text-[26px] font-medium leading-8 text-tinta">A lista de vocês ainda está vazia</h2>
      <p className="max-w-md text-tinta-suave">
        Adicionem o primeiro convidado para começar a organizar as confirmações. Se a lista já existe, importem uma planilha (CSV). Os convidados respondem pelo link do convite, sem criar conta.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={aoAdicionar} className={estiloDoBotao.primary}>
          Adicionar convidado
        </button>
        <button type="button" onClick={aoImportar} className={estiloDoBotao.secondary}>
          <Upload className="size-4" aria-hidden="true" />
          Importar lista
        </button>
      </div>
    </div>
  );
}
