// Visão agrupada: busca, um cartão por dívida/contrato/compra e a paginação.
import { Entrada } from "@/components/ui/input";
import { CartaoDoGrupo } from "./cartao-do-grupo";
import { PaginacaoDosGrupos } from "./paginacao-dos-grupos";
import type { AcoesDasDespesas } from "./use-acoes-das-despesas";
import type { EstadoDaVisaoAgrupada } from "./use-visao-agrupada";

export function VisaoAgrupada({ estado, acoes }: { estado: EstadoDaVisaoAgrupada; acoes: AcoesDasDespesas }) {
  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Entrada placeholder="Buscar por descrição ou loja..." value={estado.busca} onChange={(e) => estado.buscar(e.target.value)} className="bg-papel border-linha" />
      </div>
      {estado.daPagina.length === 0 ? (
        <div className="bg-papel border border-linha rounded-xl p-12 text-center text-tinta-suave">
          {estado.busca ? "Nenhuma despesa encontrada para a busca." : "Nenhuma despesa cadastrada para este filtro."}
        </div>
      ) : (
        <div className="space-y-4">
          {estado.daPagina.map((grupo) => (
            <CartaoDoGrupo key={grupo.id} grupo={grupo} expandido={!!estado.expandidos[grupo.id]} aoExpandir={() => estado.alternarGrupo(grupo.id)} acoes={acoes} />
          ))}
          <PaginacaoDosGrupos pagina={estado.paginaSegura} totalDePaginas={estado.totalDePaginas} totalDeItens={estado.totalDeItens} irParaPagina={(atualizar) => estado.setPagina(atualizar)} />
        </div>
      )}
    </div>
  );
}
