// Os blocos de parcelas (N parcelas de um valor, a partir de uma data) e a prévia ao vivo do que será gerado.
import { Layers } from "lucide-react";
import { Botao } from "@/components/ui/button";
import { SeletorDeData } from "@/components/ui/date-picker";
import { Entrada } from "@/components/ui/input";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import type { BlocoDeParcelas, ParcelaGerada } from "./tipos";
import type { CondicaoDePagamento } from "./use-condicao-de-pagamento";

function BlocoEditavel({ bloco, indice, podeRemover, pagamento }: { bloco: BlocoDeParcelas; indice: number; podeRemover: boolean; pagamento: CondicaoDePagamento }) {
  return (
    <div className="p-3 bg-linho border border-linha rounded-lg space-y-2">
      <div className="flex justify-between items-center text-xs font-semibold text-tinta-suave">
        <span>Bloco #{indice + 1}</span>
        {podeRemover && (
          <button type="button" onClick={() => pagamento.removerBloco(bloco.id)} className="text-perigo hover:text-perigo text-xs cursor-pointer">
            Remover bloco
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-5 pt-1 sm:grid-cols-3 sm:gap-3">
        <Entrada label="Número de parcelas" type="number" min={1} max={60} value={bloco.count} onChange={(e) => pagamento.atualizarBloco(bloco.id, "count", Number(e.target.value))} placeholder="Ex: 3" />
        <Entrada label="Valor da parcela" prefix="R$" type="number" step="0.01" value={bloco.amount} onChange={(e) => pagamento.atualizarBloco(bloco.id, "amount", e.target.value)} placeholder="Ex: 300.00" />
        <SeletorDeData label="1º vencimento" value={bloco.startDate} onChange={(e) => pagamento.atualizarBloco(bloco.id, "startDate", e.target.value)} />
      </div>
    </div>
  );
}

export function BlocosDeParcelas({ pagamento }: { pagamento: CondicaoDePagamento }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-tinta flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-brand" />
          Blocos de parcelas
        </span>
        <Botao type="button" variant="outline" size="sm" onClick={pagamento.adicionarBloco} className="text-xs h-7">+ Adicionar bloco</Botao>
      </div>
      {pagamento.blocos.map((bloco, i) => (
        <BlocoEditavel key={bloco.id} bloco={bloco} indice={i} podeRemover={pagamento.blocos.length > 1} pagamento={pagamento} />
      ))}
    </div>
  );
}

export function PreviaDasParcelas({ parcelas, total }: { parcelas: ParcelaGerada[]; total: number }) {
  if (parcelas.length === 0) return null;
  return (
    <div className="border border-linha rounded-lg p-3 bg-papel space-y-2">
      <div className="flex justify-between items-center text-xs border-b border-areia pb-2">
        <span className="font-bold text-tinta">Prévia ({parcelas.length} parcelas)</span>
        <span className="font-bold text-brand">Total: {formatarReais(total)}</span>
      </div>
      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
        {parcelas.map((p, i) => (
          <div key={i} className="flex justify-between items-center text-xs py-1 px-2 hover:bg-linho rounded">
            <span className="text-tinta font-medium">{p.description}</span>
            <div className="flex items-center gap-3">
              <span className="text-tinta-suave">{new Date(p.dueDate).toLocaleDateString("pt-BR")}</span>
              <span className="font-bold text-tinta">{formatarReais(p.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
