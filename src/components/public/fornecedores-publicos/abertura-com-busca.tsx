// Abertura da página: título e a barra de busca (texto, região, data, valor) com as categorias em chips.
import { Calendar, Loader2, MapPin, Search, X } from "lucide-react";
import { estiloDoBotao, estiloDoContainerDaLanding, estiloDoSobretituloDaLanding } from "@/components/landing/styles";
import { Entrada } from "@/components/ui/input";
import { SelecaoNativa } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CATEGORIAS, FAIXAS_DE_ORCAMENTO, REGIOES, TODAS_AS_REGIOES, VALOR_TODOS } from "./constantes";
import type { FiltrosDaTela } from "./use-filtros-dos-fornecedores";

function CampoDeData({ filtros, hojeIso }: { filtros: FiltrosDaTela; hojeIso: string }) {
  const { data, aplicarData, trocandoData, maisFiltros } = filtros;
  const limpar = (
    <button type="button" onClick={() => aplicarData("")} aria-label="Limpar data do casamento" className="grid size-9 place-items-center rounded-full text-tinta-suave hover:bg-areia hover:text-tinta">
      <X className="size-4" aria-hidden="true" />
    </button>
  );
  return (
    <div className={cn("min-w-0 flex-col sm:flex", maisFiltros || data ? "flex" : "hidden")}>
      <Entrada
        id="filtro-data" type="date" label="Data do casamento" icon={Calendar} min={hojeIso} value={data} onChange={(e) => aplicarData(e.target.value)} aria-describedby="filtro-data-dica"
        trailing={trocandoData ? <Loader2 className="mr-3 size-4 animate-spin text-tinta-suave" aria-label="Atualizando" /> : data ? limpar : undefined}
      />
      <p id="filtro-data-dica" className="sr-only">Mostra só fornecedores com a data livre na agenda.</p>
    </div>
  );
}

function BuscaDosFornecedores({ filtros, hojeIso }: { filtros: FiltrosDaTela; hojeIso: string }) {
  return (
    <form role="search" aria-label="Buscar fornecedores" onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 gap-x-3 gap-y-5 rounded-[16px] border border-linha bg-papel p-4 pt-5 shadow-aceito-1 sm:grid-cols-2 lg:grid-cols-4">
      <Entrada id="filtro-busca" type="search" label="O que você procura?" icon={Search} value={filtros.busca} onChange={(e) => filtros.setBusca(e.target.value)} placeholder="Espaço, fotógrafo, buffet..." />
      <SelecaoNativa id="filtro-regiao" label="Onde vai ser?" icon={MapPin} value={filtros.regiao} onChange={(e) => filtros.setRegiao(e.target.value)}>
        {REGIOES.map((reg) => <option key={reg} value={reg}>{reg === TODAS_AS_REGIOES ? "Todas as regiões" : reg}</option>)}
      </SelecaoNativa>
      <CampoDeData filtros={filtros} hojeIso={hojeIso} />
      <div className={cn("min-w-0 flex-col sm:flex", filtros.maisFiltros || filtros.orcamento || filtros.data ? "flex" : "hidden")}>
        <SelecaoNativa id="filtro-valor" label="Até quanto?" alwaysFloat value={filtros.orcamento} onChange={(e) => filtros.setOrcamento(e.target.value)}>
          {FAIXAS_DE_ORCAMENTO.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </SelecaoNativa>
      </div>
      <button type="button" onClick={() => filtros.setMaisFiltros((v) => !v)} aria-expanded={filtros.maisFiltros} className={cn(estiloDoBotao.quiet, "justify-self-start sm:hidden")}>
        {filtros.maisFiltros ? "Menos filtros" : "Mais filtros"}
      </button>
    </form>
  );
}

/** Categorias: faixa rolável de chips. */
function ChipsDeCategoria({ filtros }: { filtros: FiltrosDaTela }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
      <div role="group" aria-label="Categorias" className="flex gap-2">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => filtros.setCategoria(cat)}
            aria-pressed={filtros.categoria === cat}
            className={cn("inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-[8px] px-4 text-sm font-semibold transition-colors duration-150", filtros.categoria === cat ? "bg-salvia text-on-ameixa" : "bg-papel text-tinta hover:bg-areia")}
          >
            {cat === VALOR_TODOS ? "Todos" : cat}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AberturaComBusca({ filtros, hojeIso }: { filtros: FiltrosDaTela; hojeIso: string }) {
  return (
    <section className="bg-salvia-suave">
      <div className={cn(estiloDoContainerDaLanding, "flex flex-col gap-6 py-10 sm:py-16")}>
        <div className="flex max-w-[720px] flex-col gap-3">
          <p className={cn(estiloDoSobretituloDaLanding, "text-salvia")}>Fornecedores para o casamento</p>
          <h1 className="font-display text-[34px] font-medium leading-[40px] tracking-[-0.02em] text-tinta sm:text-5xl sm:leading-[1.05] lg:text-6xl">Encontre fornecedores para o seu casamento</h1>
          <p className="text-[17px] leading-[26px] text-tinta-suave sm:text-lg sm:leading-7">
            Procure fotógrafos, espaços, buffets e outros profissionais, veja o trabalho de cada um e peça orçamento. O rótulo &ldquo;Com curadoria&rdquo; indica que o Aceito analisou o cadastro; ele não garante qualidade nem preço.
          </p>
        </div>
        <BuscaDosFornecedores filtros={filtros} hojeIso={hojeIso} />
        <ChipsDeCategoria filtros={filtros} />
      </div>
    </section>
  );
}
