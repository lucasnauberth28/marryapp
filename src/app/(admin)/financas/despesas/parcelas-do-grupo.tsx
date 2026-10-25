// Tabela com as parcelas de um grupo: vencimento, descrição, forma, valor, situação e excluir.
import { CheckCircle, Clock, Trash2 } from "lucide-react";
import { Etiqueta } from "@/components/casal/ui";
import { Botao } from "@/components/ui/button";
import { Tabela, CorpoDaTabela, CelulaDaTabela, TituloDaColunaDaTabela, CabecalhoDaTabela, LinhaDaTabela } from "@/components/ui/table";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import type { DespesaAgrupada, ItemDeDespesa } from "./tipos";
import type { AcoesDasDespesas } from "./use-acoes-das-despesas";

const COLUNAS = ["Vencimento", "Descrição", "Meio de pagamento", "Valor", "Status"];

/** O chip que, ao ser tocado, troca a parcela entre paga e pendente. */
export function BotaoDeSituacao({ despesa, acoes }: { despesa: ItemDeDespesa; acoes: AcoesDasDespesas }) {
  const paga = despesa.status === "PAID";
  return (
    <button
      type="button"
      onClick={() => acoes.alternarSituacao(despesa.id, despesa.status)}
      disabled={!!acoes.alternando[despesa.id]}
      aria-busy={acoes.alternando[despesa.id] || undefined}
      aria-label={paga ? "Pago. Tocar para marcar como pendente" : "Pendente. Tocar para marcar como paga"}
      className="inline-flex min-h-11 cursor-pointer items-center rounded-lg disabled:cursor-wait disabled:opacity-50"
    >
      <Etiqueta tone={paga ? "sucesso" : "aviso"} icon={paga ? CheckCircle : Clock}>{paga ? "Pago" : "Pendente"}</Etiqueta>
    </button>
  );
}

function LinhaDaParcela({ despesa, acoes }: { despesa: ItemDeDespesa; acoes: AcoesDasDespesas }) {
  const paga = despesa.status === "PAID";
  return (
    <LinhaDaTabela className={paga ? "bg-linho/50" : ""}>
      <CelulaDaTabela className={`text-xs ${paga ? "text-tinta-suave" : "font-medium text-tinta"}`}>{new Date(despesa.dueDate).toLocaleDateString("pt-BR")}</CelulaDaTabela>
      <CelulaDaTabela className={`text-xs ${paga ? "text-tinta-suave line-through" : "text-tinta font-medium"}`}>{despesa.description}</CelulaDaTabela>
      <CelulaDaTabela className="text-xs text-tinta-suave">{despesa.paymentMethod || "—"}</CelulaDaTabela>
      <CelulaDaTabela className={`text-xs font-bold ${paga ? "text-tinta-suave" : "text-tinta"}`}>{formatarReais(despesa.amount)}</CelulaDaTabela>
      <CelulaDaTabela><BotaoDeSituacao despesa={despesa} acoes={acoes} /></CelulaDaTabela>
      <CelulaDaTabela className="text-right">
        <Botao aria-label="Excluir" variant="ghost" size="icon" className="h-7 w-7" onClick={() => acoes.pedirExclusao(despesa.id)}>
          <Trash2 className="w-3.5 h-3.5 text-perigo" />
        </Botao>
      </CelulaDaTabela>
    </LinhaDaTabela>
  );
}

export function ParcelasDoGrupo({ grupo, acoes }: { grupo: DespesaAgrupada; acoes: AcoesDasDespesas }) {
  return (
    <div className="border-t border-areia bg-linho/50 p-4 animate-in slide-in-from-top-2 duration-200">
      <div className="bg-papel rounded-lg border border-linha/80 overflow-hidden shadow-2xs">
        <Tabela>
          <CabecalhoDaTabela className="bg-linho/80">
            <LinhaDaTabela className="text-xs">
              {COLUNAS.map((titulo) => <TituloDaColunaDaTabela key={titulo} className="py-2.5">{titulo}</TituloDaColunaDaTabela>)}
              <TituloDaColunaDaTabela className="py-2.5 text-right">Ação</TituloDaColunaDaTabela>
            </LinhaDaTabela>
          </CabecalhoDaTabela>
          <CorpoDaTabela>
            {grupo.expenses.map((despesa) => <LinhaDaParcela key={despesa.id} despesa={despesa} acoes={acoes} />)}
          </CorpoDaTabela>
        </Tabela>
      </div>
    </div>
  );
}
