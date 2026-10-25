import { CircleAlert, Download, FileSpreadsheet, Upload } from "lucide-react";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { estiloDaCaixaDeErro, estiloDaDicaDoPainel, estiloDoBotao, estiloDoCartao, estiloDoSobretitulo } from "@/components/painel/styles";
import { MAXIMO_DE_LINHAS_NA_IMPORTACAO } from "@/lib/importacao-de-convidados/limites";
import type { FluxoDeImportacao } from "./use-fluxo-de-importacao";
import { baixarPlanilhaModelo } from "./utilitarios";

function ComoPreparar() {
  return (
    <div className="flex flex-col gap-2">
      <h3 className={estiloDoSobretitulo}>Como preparar a planilha</h3>
      <ul className="list-disc space-y-1 pl-5 text-[15px] leading-6 text-tinta-suave">
        <li>
          Reconhecemos as colunas pelo título, em qualquer ordem: <strong className="font-semibold text-tinta">Nome</strong>, Telefone (ou WhatsApp, Celular), E-mail, Acompanhantes (ou Lugares), Grupo e Restrição alimentar.
        </li>
        <li>O cabeçalho é opcional. Sem ele, adivinhamos pelo conteúdo e mostramos o que entendemos antes de importar.</li>
        <li>Só o nome é obrigatório. Telefone com DDD, por exemplo (11) 91234-5678.</li>
        <li>“Lugares” conta o convidado: 2 lugares é o convidado mais 1 acompanhante.</li>
        <li>Quem já está na lista (mesmo telefone) é pulado, sem duplicar. Até {MAXIMO_DE_LINHAS_NA_IMPORTACAO} convidados por vez.</li>
      </ul>
    </div>
  );
}

export function EtapaEscolher({ fluxo }: { fluxo: FluxoDeImportacao }) {
  const { fileInput, reading, error } = fluxo;
  return (
    <div className="flex flex-col gap-5">
      <div className={`${estiloDoCartao} flex flex-col items-start gap-4 p-5`}>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ameixa-suave text-ameixa">
            <FileSpreadsheet className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold leading-6 text-tinta">Escolham um arquivo CSV</h3>
            <p className={estiloDaDicaDoPainel}>
              Pode ser .csv ou .txt, separado por vírgula, ponto e vírgula ou tab. O arquivo é lido aqui no seu aparelho e só os dados da lista são enviados.
            </p>
          </div>
        </div>
        <input ref={fileInput} id="importar-arquivo" type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => void fluxo.handleFile(e.target.files?.[0])} />
        <div className="flex flex-wrap items-center gap-2">
          <BotaoComCarregamento onClick={() => fileInput.current?.click()} loading={reading} className={estiloDoBotao.primary}>
            <Upload className="size-4" aria-hidden="true" />
            Escolher arquivo
          </BotaoComCarregamento>
          <button type="button" onClick={baixarPlanilhaModelo} className={estiloDoBotao.quiet}>
            <Download className="size-4" aria-hidden="true" />
            Baixar modelo de planilha
          </button>
        </div>
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {reading ? "Lendo o arquivo" : ""}
      </div>
      {error && (
        <p role="alert" className={estiloDaCaixaDeErro}>
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      <ComoPreparar />
    </div>
  );
}
