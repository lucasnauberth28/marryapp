// A janela "Nova despesa": o botão que a abre e os três passos do cadastro.
import { CalendarRange, Plus } from "lucide-react";
import { Dialogo, ConteudoDoDialogo, CabecalhoDoDialogo, TituloDoDialogo, GatilhoDoDialogo } from "@/components/ui/dialog";
import { estiloDoBotao } from "@/components/landing/styles";
import { PassoDosDetalhes } from "./passo-detalhes";
import { PassoDoPagamento } from "./passo-pagamento";
import { PassoDoTipo } from "./passo-tipo";
import type { CartaoDaCarteira, OpcaoDeFornecedor } from "./tipos";
import type { CadastroDeDespesa } from "./use-cadastro-de-despesa";

function ProgressoDosPassos({ passo }: { passo: number }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      {[1, 2, 3].map((n) => (
        <div key={n} className={`flex-1 h-1.5 rounded-full ${passo >= n ? "bg-brand" : "bg-linha"}`} />
      ))}
    </div>
  );
}

interface DialogoNovaDespesaProps {
  cadastro: CadastroDeDespesa;
  fornecedores: OpcaoDeFornecedor[];
  cartoes: CartaoDaCarteira[];
}

export function DialogoNovaDespesa({ cadastro, fornecedores, cartoes }: DialogoNovaDespesaProps) {
  const { dados, passo, setPasso } = cadastro;
  return (
    <Dialogo open={cadastro.aberto} onOpenChange={cadastro.aoMudarAberto}>
      <GatilhoDoDialogo asChild>
        <button type="button" className={estiloDoBotao.primary}>
          <Plus className="size-4" aria-hidden="true" /> Nova despesa
        </button>
      </GatilhoDoDialogo>
      <ConteudoDoDialogo className="max-w-[calc(100%-2rem)] sm:max-w-3xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-7">
        <CabecalhoDoDialogo>
          <TituloDoDialogo className="flex items-center gap-2 text-base">
            <CalendarRange className="w-5 h-5 text-brand" />
            Cadastrar despesa ou compra
          </TituloDoDialogo>
          <ProgressoDosPassos passo={passo} />
        </CabecalhoDoDialogo>
        <form key={cadastro.chaveDoFormulario} onSubmit={cadastro.enviar} className="space-y-4 mt-2">
          {passo === 1 && <PassoDoTipo tipo={dados.tipo} aoEscolher={dados.setTipo} aoAvancar={() => setPasso(2)} />}
          {passo === 2 && <PassoDosDetalhes dados={dados} fornecedores={fornecedores} cartoes={cartoes} aoVoltar={() => setPasso(1)} aoAvancar={() => setPasso(3)} />}
          {passo === 3 && <PassoDoPagamento cadastro={cadastro} />}
        </form>
      </ConteudoDoDialogo>
    </Dialogo>
  );
}
