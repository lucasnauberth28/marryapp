import { Plus } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { Entrada } from "@/components/ui/input";
import { ConteudoDaSelecao, GatilhoDaSelecao, ItemDaSelecao, Selecao, ValorDaSelecao } from "@/components/ui/select";
import { AreaDeTexto } from "@/components/ui/textarea";
import { InterruptorDeVisibilidade } from "../interruptor-de-visibilidade";
import { ListaDeItens } from "../lista-de-itens";
import { ROTULOS_DAS_DICAS, type ChaveDaConfiguracao, type ItemParaExcluir } from "../tipos";
import type { EditorDoSite } from "../use-configuracoes-do-site";
import type { useDicas } from "../use-historia-e-dicas";

interface PropriedadesDaSecaoDasDicas {
  chave: ChaveDaConfiguracao;
  descricao?: string;
  site: EditorDoSite;
  dicas: ReturnType<typeof useDicas>;
  ocupado: boolean;
  pedirExclusao: (item: ItemParaExcluir) => void;
}

function NovaDica({ dicas, ocupado }: Pick<PropriedadesDaSecaoDasDicas, "dicas" | "ocupado">) {
  const { nova, setNova } = dicas;
  return (
    <fieldset className="flex flex-col gap-5 rounded-xl border border-linha p-3 pt-4">
      <legend className="px-1 text-sm font-semibold text-tinta">Nova dica</legend>
      <Selecao value={nova.category} onValueChange={(v) => setNova({ ...nova, category: v })}>
        <GatilhoDaSelecao id="tip-category" label="Categoria">
          <ValorDaSelecao />
        </GatilhoDaSelecao>
        <ConteudoDaSelecao>
          {Object.entries(ROTULOS_DAS_DICAS).map(([value, label]) => (
            <ItemDaSelecao key={value} value={value}>
              {label}
            </ItemDaSelecao>
          ))}
        </ConteudoDaSelecao>
      </Selecao>
      <Entrada id="tip-title" label="Nome do lugar" value={nova.title} onChange={(e) => setNova({ ...nova, title: e.target.value })} />
      <Entrada id="tip-address" label="Endereço" value={nova.address} onChange={(e) => setNova({ ...nova, address: e.target.value })} />
      <Entrada id="tip-phone" label="Telefone" value={nova.phone} onChange={(e) => setNova({ ...nova, phone: e.target.value })} />
      <Entrada id="tip-link" label="Site ou link de reserva" value={nova.linkUrl} onChange={(e) => setNova({ ...nova, linkUrl: e.target.value })} placeholder="https://..." />
      <Entrada id="tip-discount" label="Cupom de desconto" value={nova.discountCode} onChange={(e) => setNova({ ...nova, discountCode: e.target.value.toUpperCase() })} inputClassName="font-semibold uppercase" />
      <AreaDeTexto id="tip-desc" label="Descrição" rows={2} value={nova.description} onChange={(e) => setNova({ ...nova, description: e.target.value })} />
      <BotaoComCarregamento onClick={dicas.adicionar} loading={dicas.adicionando} disabled={ocupado} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm} w-fit`}>
        <Plus className="size-4" aria-hidden="true" /> Adicionar dica
      </BotaoComCarregamento>
    </fieldset>
  );
}

export function SecaoDasDicas({ chave, descricao, site, dicas, ocupado, pedirExclusao }: PropriedadesDaSecaoDasDicas) {
  return (
    <>
      <InterruptorDeVisibilidade chave={chave} descricao={descricao} site={site} />
      <NovaDica dicas={dicas} ocupado={ocupado} />
      <ListaDeItens
        title={`Dicas publicadas (${dicas.itens.length})`}
        empty="Nenhuma dica ainda. A seção só aparece no site quando houver pelo menos uma."
        items={dicas.itens.map((t) => ({ id: t.id, eyebrow: ROTULOS_DAS_DICAS[t.category] ?? t.category, title: t.title, text: t.discountCode ? `Cupom ${t.discountCode}` : t.description }))}
        onDelete={(item) => pedirExclusao({ tipo: "tip", id: item.id, title: item.title })}
      />
    </>
  );
}
