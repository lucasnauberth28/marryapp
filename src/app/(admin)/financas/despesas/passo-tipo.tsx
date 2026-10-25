// Passo 1 do cadastro: contrato com fornecedor ou compra avulsa.
import { ArrowRight, Building2, Check, ShoppingBag } from "lucide-react";
import { Botao } from "@/components/ui/button";
import { estiloDoBotao } from "@/components/landing/styles";
import type { TipoDeDespesa } from "./tipos";

interface CartaoDoTipoProps {
  selecionado: boolean;
  aoEscolher: () => void;
  Icone: typeof Building2;
  titulo: string;
  texto: string;
  cores: { selecionado: string; icone: string; marca: string };
}

function CartaoDoTipo({ selecionado, aoEscolher, Icone, titulo, texto, cores }: CartaoDoTipoProps) {
  return (
    <div
      onClick={aoEscolher}
      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
        selecionado ? cores.selecionado : "border-linha hover:border-linha hover:bg-linho/50"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${cores.icone}`}>
          <Icone className="w-6 h-6" />
        </div>
        {selecionado && <Check className={`w-5 h-5 ${cores.marca}`} />}
      </div>
      <div>
        <h4 className="font-bold text-sm text-tinta">{titulo}</h4>
        <p className="text-xs text-tinta-suave mt-1">{texto}</p>
      </div>
    </div>
  );
}

const CORES_DO_CONTRATO = { selecionado: "border-brand bg-brand-100/30 shadow-md ring-2 ring-brand/20", icone: "bg-brand/10 text-brand", marca: "text-brand" };
const CORES_DA_COMPRA = { selecionado: "border-salvia bg-salvia-suave/50 shadow-md ring-2 ring-salvia/20", icone: "bg-salvia-suave text-salvia", marca: "text-salvia" };

export function PassoDoTipo({ tipo, aoEscolher, aoAvancar }: { tipo: TipoDeDespesa; aoEscolher: (t: TipoDeDespesa) => void; aoAvancar: () => void }) {
  return (
    <div className="space-y-4 py-2 animate-in fade-in duration-200">
      <div className="text-center space-y-1">
        <h3 className="font-bold text-sm text-tinta">Qual o tipo desta despesa?</h3>
        <p className="text-xs text-tinta-suave">Escolha entre contrato de prestação de serviços ou uma compra pontual.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CartaoDoTipo selecionado={tipo === "CONTRACT"} aoEscolher={() => aoEscolher("CONTRACT")} Icone={Building2} cores={CORES_DO_CONTRATO} titulo="Contrato com fornecedor" texto="Serviços contratados como Buffet, Fotografia, DJ, Espaço do evento ou Decoração." />
        <CartaoDoTipo selecionado={tipo === "PURCHASE"} aoEscolher={() => aoEscolher("PURCHASE")} Icone={ShoppingBag} cores={CORES_DA_COMPRA} titulo="Compra avulsa ou mimos" texto="Lembrancinhas, itens de papelaria, mimos para padrinhos, Shopee, Mercado Livre, etc." />
      </div>
      <Botao type="button" onClick={aoAvancar} className={`${estiloDoBotao.primary} ${estiloDoBotao.block} mt-4`}>
        Próximo: detalhes e origem <ArrowRight className="w-4 h-4 ml-2" />
      </Botao>
    </div>
  );
}
