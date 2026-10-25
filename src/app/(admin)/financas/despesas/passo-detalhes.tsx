// Passo 2 do cadastro: descrição, fornecedor (ou loja e link), como foi pago e a foto da compra.
import { useMemo } from "react";
import { ArrowRight, Upload } from "lucide-react";
import { toast } from "sonner";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";
import { Selecao, ConteudoDaSelecao, ItemDaSelecao, GatilhoDaSelecao, ValorDaSelecao } from "@/components/ui/select";
import { estiloDoBotao } from "@/components/landing/styles";
import { formasDePagamentoOferecidas } from "./parcelas";
import type { CartaoDaCarteira, OpcaoDeFornecedor } from "./tipos";
import type { DadosDaDespesa } from "./use-dados-da-despesa";

function OrigemDaDespesa({ dados, fornecedores }: { dados: DadosDaDespesa; fornecedores: OpcaoDeFornecedor[] }) {
  if (dados.tipo === "CONTRACT") {
    return (
      <Selecao value={dados.fornecedorId} onValueChange={dados.setFornecedorId}>
        <GatilhoDaSelecao label="Fornecedor">
          <ValorDaSelecao />
        </GatilhoDaSelecao>
        <ConteudoDaSelecao>
          {fornecedores.map((v) => (
            <ItemDaSelecao key={v.id} value={v.id}>{v.name} ({v.category})</ItemDaSelecao>
          ))}
        </ConteudoDaSelecao>
      </Selecao>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Entrada label="Loja ou local" optional placeholder="Ex: Shopee, Mercado Livre, Loja X" value={dados.loja} onChange={(e) => dados.setLoja(e.target.value)} />
      <Entrada label="Link da compra ou do produto" placeholder="https://shopee.com.br/produto..." value={dados.link} onChange={(e) => dados.setLink(e.target.value)} type="url" />
    </div>
  );
}

function FormasDePagamentoEscolhaveis({ dados, cartoes }: { dados: DadosDaDespesa; cartoes: CartaoDaCarteira[] }) {
  const formas = useMemo(() => formasDePagamentoOferecidas(cartoes), [cartoes]);
  return (
    <div role="group" aria-labelledby="despesa-forma-pagamento">
      <span id="despesa-forma-pagamento" className="text-xs font-semibold text-tinta-suave mb-1.5 block">Como foi ou será pago</span>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {formas.map((forma) => {
          const Icone = forma.icon;
          const selecionada = dados.formaDePagamento === forma.id || dados.formaDePagamento === forma.label;
          return (
            <button
              key={forma.id}
              type="button"
              onClick={() => dados.setFormaDePagamento(forma.label)}
              aria-pressed={selecionada}
              className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                selecionada ? "border-brand bg-brand-100/40 text-brand font-bold shadow-xs" : "border-linha hover:bg-linho text-tinta"
              }`}
            >
              <Icone className="w-3.5 h-3.5 shrink-0 text-brand" />
              <span className="truncate">{forma.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Campo para anexar a foto da compra, com prévia e botão de remover. */
function FotoDaCompra({ dados }: { dados: DadosDaDespesa }) {
  return (
    <div>
      <span className="text-xs font-semibold text-tinta-suave mb-1 block">Foto da compra ou do produto (opcional)</span>
      <div className="border-2 border-dashed border-linha rounded-xl p-3 text-center relative hover:bg-linho transition flex items-center justify-center gap-3">
        <input aria-label="Foto da compra ou do produto" type="file" accept="image/*" onChange={dados.aoEscolherImagem} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
        {dados.imagem ? (
          <div className="flex items-center gap-3">
            <img src={dados.imagem} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-linha" />
            <span className="text-xs font-medium text-tinta truncate max-w-[200px]">{dados.nomeDaImagem}</span>
            <Botao type="button" variant="ghost" size="sm" onClick={() => dados.setImagem("")} className="text-xs text-perigo h-6 px-2">Remover</Botao>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-tinta-suave text-xs py-1">
            <Upload className="w-4 h-4 text-tinta-suave" />
            <span>Clique para anexar foto do produto ou print da compra</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface PassoDosDetalhesProps {
  dados: DadosDaDespesa;
  fornecedores: OpcaoDeFornecedor[];
  cartoes: CartaoDaCarteira[];
  aoVoltar: () => void;
  aoAvancar: () => void;
}

export function PassoDosDetalhes({ dados, fornecedores, cartoes, aoVoltar, aoAvancar }: PassoDosDetalhesProps) {
  const avancar = () => {
    const problema = !dados.descricao.trim() ? "Informe a descrição da despesa." : dados.tipo === "CONTRACT" && !dados.fornecedorId ? "Selecione um fornecedor." : null;
    if (problema) {
      toast.error(problema);
      return;
    }
    aoAvancar();
  };
  return (
    <div className="space-y-4 py-1 animate-in fade-in duration-200">
      <div className="flex justify-between items-center pb-2 border-b border-areia">
        <span className="text-sm font-semibold text-tinta">Passo 2 de 3: {dados.tipo === "CONTRACT" ? "detalhes do contrato" : "detalhes da compra"}</span>
        <Botao type="button" variant="ghost" size="sm" onClick={aoVoltar} className="text-xs text-tinta-suave">Voltar ao tipo</Botao>
      </div>
      <Entrada label="Descrição da despesa" placeholder={dados.tipo === "CONTRACT" ? "Ex: Sinal do Buffet ou Contrato de Fotos" : "Ex: Lembrancinhas para Padrinhos"} value={dados.descricao} onChange={(e) => dados.setDescricao(e.target.value)} required />
      <OrigemDaDespesa dados={dados} fornecedores={fornecedores} />
      <FormasDePagamentoEscolhaveis dados={dados} cartoes={cartoes} />
      <FotoDaCompra dados={dados} />
      <div className="flex gap-2 pt-2">
        <Botao type="button" variant="outline" onClick={aoVoltar} className="w-1/3">Voltar</Botao>
        <Botao type="button" onClick={avancar} className={`${estiloDoBotao.primary} w-2/3`}>
          Próximo: condição de pagamento <ArrowRight className="w-4 h-4 ml-2" />
        </Botao>
      </div>
    </div>
  );
}
