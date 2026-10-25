// Barra de cima da tela de despesas: filtro por tipo, visão (agrupada ou detalhada) e o botão de cadastro.
import type { LucideIcon } from "lucide-react";
import { Building2, Layers, ListFilter, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";

export type FiltroDeTipo = "ALL" | "CONTRACT" | "PURCHASE";
export type Visao = "grouped" | "detailed";

interface OpcaoDoControle<T extends string> {
  valor: T;
  texto: string;
  Icone?: LucideIcon;
  classeDoIcone?: string;
}

function ControleSegmentado<T extends string>({ opcoes, valor, aoMudar }: { opcoes: OpcaoDoControle<T>[]; valor: T; aoMudar: (v: T) => void }) {
  return (
    <div className="flex rounded-xl border border-linha bg-areia p-1">
      {opcoes.map(({ valor: v, texto, Icone, classeDoIcone }) => (
        <button
          key={v}
          type="button"
          onClick={() => aoMudar(v)}
          className={`min-h-11 px-3 text-sm font-semibold rounded-lg transition-all sm:min-h-9 ${Icone ? "flex items-center gap-1" : ""} ${
            valor === v ? "bg-papel text-tinta shadow-xs" : "text-tinta-suave hover:text-tinta"
          }`}
        >
          {Icone && <Icone className={classeDoIcone} />}
          {texto}
        </button>
      ))}
    </div>
  );
}

interface BarraDeFiltrosProps {
  total: number;
  filtro: FiltroDeTipo;
  aoMudarFiltro: (f: FiltroDeTipo) => void;
  visao: Visao;
  aoMudarVisao: (v: Visao) => void;
  botaoDeCadastro: ReactNode;
}

export function BarraDeFiltros({ total, filtro, aoMudarFiltro, visao, aoMudarVisao, botaoDeCadastro }: BarraDeFiltrosProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
      <div className="flex flex-wrap gap-2 items-center">
        <ControleSegmentado<FiltroDeTipo>
          valor={filtro}
          aoMudar={aoMudarFiltro}
          opcoes={[
            { valor: "ALL", texto: `Todas (${total})` },
            { valor: "CONTRACT", texto: "Contratos", Icone: Building2, classeDoIcone: "w-3 h-3" },
            { valor: "PURCHASE", texto: "Compras avulsas", Icone: ShoppingBag, classeDoIcone: "w-3 h-3" },
          ]}
        />
        <ControleSegmentado<Visao>
          valor={visao}
          aoMudar={aoMudarVisao}
          opcoes={[
            { valor: "grouped", texto: "Agrupado", Icone: Layers, classeDoIcone: "w-3.5 h-3.5 text-brand" },
            { valor: "detailed", texto: "Detalhado", Icone: ListFilter, classeDoIcone: "w-3.5 h-3.5 text-brand" },
          ]}
        />
      </div>
      {botaoDeCadastro}
    </div>
  );
}
