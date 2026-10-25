// Passo 3 do cadastro: pagamento único (valor e vencimento) ou parcelado em blocos, com a prévia das parcelas.
import { Botao } from "@/components/ui/button";
import { SeletorDeData } from "@/components/ui/date-picker";
import { Entrada } from "@/components/ui/input";
import { estiloDoBotao } from "@/components/landing/styles";
import { BlocosDeParcelas, PreviaDasParcelas } from "./blocos-de-parcelas";
import type { CadastroDeDespesa } from "./use-cadastro-de-despesa";

function EscolhaDoModo({ cadastro }: { cadastro: CadastroDeDespesa }) {
  const { modo, setModo } = cadastro.pagamento;
  const botao = (valor: "single" | "installment", texto: string) => (
    <Botao type="button" variant={modo === valor ? "default" : "ghost"} size="sm" onClick={() => setModo(valor)} className={`flex-1 h-8 text-xs font-semibold rounded-md ${modo === valor ? "shadow-sm" : ""}`}>
      {texto}
    </Botao>
  );
  return <div className="flex bg-areia p-1 rounded-lg border border-linha">{botao("single", "Pagamento único")}{botao("installment", "Parcelado")}</div>;
}

function PagamentoUnico({ cadastro }: { cadastro: CadastroDeDespesa }) {
  const p = cadastro.pagamento;
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Entrada label="Valor" prefix="R$" placeholder="Ex: 350.00" type="number" step="0.01" value={p.valorUnico} onChange={(e) => p.setValorUnico(e.target.value)} required />
      <SeletorDeData label="Vencimento" value={p.vencimentoUnico} onChange={(e) => p.setVencimentoUnico(e.target.value)} required />
    </div>
  );
}

export function PassoDoPagamento({ cadastro }: { cadastro: CadastroDeDespesa }) {
  const { pagamento, parcelas, totalDasParcelas, carregando, setPasso } = cadastro;
  return (
    <div className="space-y-4 py-1 animate-in fade-in duration-200">
      <div className="flex justify-between items-center pb-2 border-b border-areia">
        <span className="text-sm font-semibold text-tinta">Passo 3 de 3: condição de pagamento</span>
        <Botao type="button" variant="ghost" size="sm" onClick={() => setPasso(2)} className="text-xs text-tinta-suave">Voltar aos detalhes</Botao>
      </div>
      <EscolhaDoModo cadastro={cadastro} />
      {pagamento.modo === "single" ? (
        <PagamentoUnico cadastro={cadastro} />
      ) : (
        <div className="space-y-4">
          <BlocosDeParcelas pagamento={pagamento} />
          <PreviaDasParcelas parcelas={parcelas} total={totalDasParcelas} />
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <Botao type="button" variant="outline" onClick={() => setPasso(2)} className="w-1/3">Voltar</Botao>
        <Botao type="submit" className={`${estiloDoBotao.primary} w-2/3`} loading={carregando}>
          {pagamento.modo === "single" ? "Cadastrar despesa" : `Gerar ${parcelas.length} Parcelas`}
        </Botao>
      </div>
    </div>
  );
}
