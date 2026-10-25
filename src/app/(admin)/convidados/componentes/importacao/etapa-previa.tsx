import { AlertTriangle, CircleAlert } from "lucide-react";
import { estiloDaCaixaDeErro, estiloDaDicaDoPainel, estiloDoBotao, estiloDoSobretitulo } from "@/components/painel/styles";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarTelefone } from "@/lib/formatacao/telefone";
import type { CampoDaImportacao } from "@/lib/importacao-de-convidados/colunas";
import type { PlanoDaImportacao } from "@/lib/importacao-de-convidados/repetidos";
import { CLASSE_DO_TITULO, ROTULO_DO_CAMPO, type PlanilhaLida } from "./tipos";
import type { FluxoDeImportacao } from "./use-fluxo-de-importacao";

const LIMITE_DA_LISTA_DE_NOVOS = 100;

function Numero({ titulo, valor, fundo, corDoTitulo }: { titulo: string; valor: number; fundo: string; corDoTitulo: string }) {
  return (
    <div className={`rounded-xl border border-linha px-4 py-3 ${fundo}`}>
      <dt className={`text-sm font-semibold ${corDoTitulo}`}>{titulo}</dt>
      <dd className="font-num text-[28px] leading-8 text-tinta tabular-nums">{valor}</dd>
    </div>
  );
}

function ResumoDaPrevia({ plan }: { plan: PlanoDaImportacao }) {
  const comProblema = plan.invalid.length > 0;
  return (
    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <Numero titulo="Serão adicionados" valor={plan.toAdd.length} fundo="bg-sucesso-suave" corDoTitulo="text-sucesso" />
      <Numero titulo="Já estão na lista" valor={plan.duplicates.length} fundo="bg-areia" corDoTitulo="text-tinta-suave" />
      <Numero titulo="Com problema" valor={plan.invalid.length} fundo={comProblema ? "bg-aviso-suave" : "bg-areia"} corDoTitulo={comProblema ? "text-aviso" : "text-tinta-suave"} />
    </dl>
  );
}

function LinhasComProblema({ invalid }: { invalid: PlanoDaImportacao["invalid"] }) {
  return (
    <section aria-labelledby="importar-problemas" className="flex flex-col gap-2">
      <h4 id="importar-problemas" className="flex items-center gap-2 text-sm font-semibold text-aviso">
        <AlertTriangle className="size-4" aria-hidden="true" />
        Estas linhas ficam de fora até serem corrigidas
      </h4>
      <div className="max-h-52 overflow-y-auto rounded-xl border border-linha" tabIndex={0} aria-label="Linhas com problema">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-papel">
            <tr className="border-b border-linha">
              {["Linha", "Nome", "O que houve"].map((titulo) => (
                <th key={titulo} scope="col" className={`${estiloDoSobretitulo} px-3 py-2`}>{titulo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invalid.map((r) => (
              <tr key={r.line} className="border-b border-linha last:border-b-0">
                <td className="px-3 py-2 tabular-nums text-tinta-suave">{r.line}</td>
                <td className="px-3 py-2 text-tinta">{r.name || "(sem nome)"}</td>
                <td className="px-3 py-2 text-aviso">{r.problem}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Repetidos({ duplicates }: { duplicates: PlanoDaImportacao["duplicates"] }) {
  return (
    <details className="rounded-xl border border-linha px-4 py-3">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-tinta">Ver quem já está na lista ({duplicates.length})</summary>
      <ul className="mt-1 max-h-44 space-y-1 overflow-y-auto text-sm text-tinta-suave">
        {duplicates.map(({ row, reason }) => (
          <li key={row.line}>
            {row.name}
            {row.phone ? `, ${formatarTelefone(row.phone)}` : ""}
            {reason === "in_file" ? " (aparece mais de uma vez na planilha)" : ""}
          </li>
        ))}
      </ul>
    </details>
  );
}

function NovosConvidados({ toAdd }: { toAdd: PlanoDaImportacao["toAdd"] }) {
  return (
    <details className="rounded-xl border border-linha px-4 py-3">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-tinta">Ver quem será adicionado ({toAdd.length})</summary>
      <ul className="mt-1 max-h-44 space-y-1 overflow-y-auto text-sm text-tinta-suave">
        {toAdd.slice(0, LIMITE_DA_LISTA_DE_NOVOS).map((r) => (
          <li key={r.line}>
            <span className="font-semibold text-tinta">{r.name}</span>
            {r.phone ? `, ${formatarTelefone(r.phone)}` : ", sem telefone"}
            {r.companions > 0 ? `, ${pluralizar(r.companions, "acompanhante", "acompanhantes")}` : ""}
            {r.category ? `, ${r.category}` : ""}
          </li>
        ))}
        {toAdd.length > LIMITE_DA_LISTA_DE_NOVOS && <li>e mais {toAdd.length - LIMITE_DA_LISTA_DE_NOVOS}...</li>}
      </ul>
    </details>
  );
}

function Cabecalho({ sheet, titulo }: { sheet: PlanilhaLida; titulo: React.Ref<HTMLHeadingElement> }) {
  const colunas = (Object.keys(ROTULO_DO_CAMPO) as CampoDaImportacao[]).filter((f) => sheet.columns[f] !== undefined).map((f) => ROTULO_DO_CAMPO[f]);
  return (
    <div className="flex flex-col gap-1">
      <h3 ref={titulo} tabIndex={-1} className={CLASSE_DO_TITULO}>
        Confira antes de importar
      </h3>
      <p className={estiloDaDicaDoPainel}>
        Arquivo: <span className="font-semibold text-tinta">{sheet.fileName}</span>. Colunas que entendemos: {colunas.join(", ")}.
        {!sheet.hasHeader && " Sua planilha não tinha cabeçalho: adivinhamos as colunas pelo conteúdo. Se algo estiver errado, ajuste o arquivo e escolha de novo."}
      </p>
    </div>
  );
}

export function EtapaPrevia({ fluxo, titulo, sheet, plan }: { fluxo: FluxoDeImportacao; titulo: React.Ref<HTMLHeadingElement>; sheet: PlanilhaLida; plan: PlanoDaImportacao }) {
  const novos = plan.toAdd.length;
  return (
    <div className="flex flex-col gap-5">
      <Cabecalho sheet={sheet} titulo={titulo} />
      <ResumoDaPrevia plan={plan} />
      {plan.invalid.length > 0 && <LinhasComProblema invalid={plan.invalid} />}
      {plan.duplicates.length > 0 && <Repetidos duplicates={plan.duplicates} />}
      {novos > 0 && <NovosConvidados toAdd={plan.toAdd} />}
      {novos === 0 && <p className="rounded-xl bg-areia px-4 py-3 text-sm text-tinta-suave">Não há nenhum convidado novo para adicionar. Corrija o arquivo ou escolha outro.</p>}
      {fluxo.error && (
        <p role="alert" className={estiloDaCaixaDeErro}>
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {fluxo.error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={fluxo.escolherOutro} className={estiloDoBotao.secondary}>
          Escolher outro arquivo
        </button>
        <button type="button" onClick={() => void fluxo.runImport()} disabled={novos === 0} className={estiloDoBotao.primary}>
          Importar {pluralizar(novos, "convidado", "convidados")}
        </button>
      </div>
    </div>
  );
}
